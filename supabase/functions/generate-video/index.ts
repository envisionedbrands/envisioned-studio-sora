import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const kieApiKey = Deno.env.get("KIE_API_KEY");

    if (!kieApiKey) {
      throw new Error("KIE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { videoId } = await req.json();

    // Get video record
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .eq("user_id", user.id)
      .single();

    if (videoError || !video) {
      throw new Error("Video not found");
    }

    // Check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.credits <= 0) {
      await supabase
        .from("videos")
        .update({ status: "fail" })
        .eq("id", videoId);
      
      throw new Error("Insufficient credits");
    }

    console.log("Creating Kie.ai task for video:", videoId);

    // Create task with Kie.ai
    const kiePayload: any = {
      model: video.model,
      input: {
        prompt: video.prompt,
        aspectRatio: video.aspect_ratio,
        nFrames: video.n_frames,
        removeWatermark: video.remove_watermark,
      },
    };

    if (video.image_url) {
      kiePayload.input.imageUrls = [video.image_url];
    }

    const createResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(kiePayload),
    });

    const createData = await createResponse.json();
    const taskId = createData?.data?.taskId;

    if (!taskId) {
      console.error("Task creation failed:", createData);
      throw new Error("Failed to create task");
    }

    console.log("Task created:", taskId);

    // Update video with task ID and set to processing
    await supabase
      .from("videos")
      .update({ task_id: taskId, status: "processing" })
      .eq("id", videoId);

    // Poll for completion (max 60 attempts = 5 minutes)
    let attempts = 0;
    const maxAttempts = 60;
    let taskComplete = false;

    while (attempts < maxAttempts && !taskComplete) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      console.log(`Polling attempt ${attempts}/${maxAttempts} for task ${taskId}`);

      const pollResponse = await fetch(
        `https://api.kie.ai/api/v1/jobs/queryTask?taskId=${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${kieApiKey}`,
          },
        }
      );

      const pollData = await pollResponse.json();
      console.log("Full poll response:", JSON.stringify(pollData));
      
      const state = pollData?.data?.state;
      console.log("Task state:", state);

      if (!pollResponse.ok) {
        console.error("Poll response not OK:", pollResponse.status, pollData);
      }

      if (state === "success") {
        const resultJson = pollData.data.resultJson;
        let resultUrls = [];

        try {
          const parsed = JSON.parse(resultJson);
          resultUrls = parsed.resultUrls || [];
        } catch (e) {
          console.error("Failed to parse result JSON:", e);
        }

        const resultUrl = resultUrls[0] || null;

        console.log("Task completed successfully, result URL:", resultUrl);

        // Update video record
        await supabase
          .from("videos")
          .update({
            status: "success",
            result_url: resultUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", videoId);

        // Deduct credit
        await supabase
          .from("profiles")
          .update({ credits: profile.credits - 1 })
          .eq("id", user.id);

        taskComplete = true;
      } else if (state === "fail") {
        console.error("Task failed");

        await supabase
          .from("videos")
          .update({
            status: "fail",
            updated_at: new Date().toISOString(),
          })
          .eq("id", videoId);

        taskComplete = true;
      }
    }

    if (!taskComplete) {
      console.log("Task timed out after max attempts");
      await supabase
        .from("videos")
        .update({ status: "fail" })
        .eq("id", videoId);
    }

    return new Response(
      JSON.stringify({
        message: "Task initiated",
        taskId,
        videoId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-video:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
