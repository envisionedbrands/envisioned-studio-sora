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

    console.log("Polling for processing videos...");

    // Get all processing videos
    const { data: processingVideos, error: fetchError } = await supabase
      .from("videos")
      .select("*")
      .eq("status", "processing")
      .not("task_id", "is", null);

    if (fetchError) {
      console.error("Error fetching processing videos:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${processingVideos?.length || 0} processing videos`);

    if (!processingVideos || processingVideos.length === 0) {
      return new Response(
        JSON.stringify({ message: "No processing videos found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = [];

    // Check status of each video
    for (const video of processingVideos) {
      try {
        console.log(`Checking status for video ${video.id}, task ${video.task_id}`);

        const pollResponse = await fetch(
          `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${video.task_id}`,
          {
            headers: {
              Authorization: `Bearer ${kieApiKey}`,
            },
          }
        );

        const pollData = await pollResponse.json();
        console.log(`Task ${video.task_id} response:`, JSON.stringify(pollData));

        const state = pollData?.data?.state;

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

          console.log(`Video ${video.id} completed successfully, URL: ${resultUrl}`);

          // Update video to success
          // Note: Credits were already deducted in generate-video function
          await supabase
            .from("videos")
            .update({
              status: "success",
              result_url: resultUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", video.id);

          results.push({ videoId: video.id, status: "success" });
        } else if (state === "fail") {
          const failCode = pollData.data?.failCode || null;
          const failMsg = pollData.data?.failMsg || "Video generation failed";
          const failReason = failMsg + (failCode ? ` (Error code: ${failCode})` : "");
          
          console.log(`Video ${video.id} failed: ${failReason}`);

          await supabase
            .from("videos")
            .update({
              status: "fail",
              fail_reason: failReason,
              updated_at: new Date().toISOString(),
            })
            .eq("id", video.id);

          results.push({ videoId: video.id, status: "fail", reason: failReason });
        } else {
          console.log(`Video ${video.id} still processing, state: ${state}`);
          results.push({ videoId: video.id, status: "still_processing", state });
        }
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.push({ videoId: video.id, status: "error", error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Polling completed",
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in poll-video-status:", error);
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
