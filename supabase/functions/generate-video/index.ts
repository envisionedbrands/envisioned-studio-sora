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
    const creditsRequired = video.model === "sora-2-pro-storyboard" ? 2 : 1;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.credits < creditsRequired) {
      await supabase
        .from("videos")
        .update({ status: "fail" })
        .eq("id", videoId);
      
      throw new Error(`Insufficient credits (requires ${creditsRequired})`);
    }

    console.log("Creating Kie.ai task for video:", videoId);

    // Create task with Kie.ai
    const kiePayload: any = {
      model: video.model,
      input: {} as any,
    };

    // Handle different model types
    if (video.model === "sora-2-pro-storyboard") {
      // Storyboard model requires shots array
      kiePayload.input = {
        shots: [
          {
            description: video.prompt,
            duration: video.n_frames / 30, // Convert frames to seconds
          }
        ],
        n_frames: video.n_frames,
        aspect_ratio: video.aspect_ratio === "16:9" ? "landscape" : "portrait",
      };

      // Add reference images if provided
      if (video.image_url) {
        try {
          const parsedUrls = JSON.parse(video.image_url);
          if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
            kiePayload.input.image_urls = parsedUrls;
          }
        } catch {
          kiePayload.input.image_urls = [video.image_url];
        }
      }
    } else {
      // Standard text-to-video or image-to-video models
      kiePayload.input = {
        prompt: video.prompt,
        aspectRatio: video.aspect_ratio,
        nFrames: video.n_frames,
        removeWatermark: video.remove_watermark,
      };

      // Handle image URLs for image-to-video models
      if (video.image_url && video.model.includes("image-to-video")) {
        kiePayload.input.image_urls = [video.image_url];
      }
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

    return new Response(
      JSON.stringify({
        message: "Task created successfully. Processing will continue in background.",
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
