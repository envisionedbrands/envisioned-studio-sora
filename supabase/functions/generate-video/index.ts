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
    console.log('Processing video generation for videoId:', videoId);

    // Rate limiting: 20 video generation requests per hour per user
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        _identifier: user.id,
        _action: 'video_generation',
        _max_attempts: 20,
        _window_minutes: 60
      });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    } else if (rateLimitData && !rateLimitData.allowed) {
      const resetAt = new Date(rateLimitData.reset_at);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: `Too many video generation requests. Please try again after ${resetAt.toLocaleTimeString()}.`,
          reset_at: rateLimitData.reset_at
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    // Check credits and deduct immediately to prevent race condition (skip for admins)
    if (!isAdmin) {
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

      // SECURITY FIX: Deduct credits immediately using optimistic locking
      const { error: deductError } = await supabase
        .from("profiles")
        .update({ credits: profile.credits - creditsRequired })
        .eq("id", user.id)
        .eq("credits", profile.credits); // Atomic check to prevent race condition

      if (deductError) {
        console.error('Credit deduction failed:', deductError);
        await supabase
          .from("videos")
          .update({ status: "fail" })
          .eq("id", videoId);
        throw new Error('Credit deduction failed. Please try again.');
      }

      console.log(`Credits deducted: ${creditsRequired} credits from user ${user.id}`);
    } else {
      console.log(`Admin user ${user.id} - skipping credit check`);
    }

    console.log("Creating Kie.ai task for video:", videoId);
    console.log("Model:", video.model);

    // Create task with Kie.ai
    const kiePayload: any = {
      model: video.model,
      input: {} as any,
    };

    // Handle different model types
    if (video.model === "sora-2-pro-storyboard") {
      // Storyboard model requires shots array
      // Convert frames back to seconds for the API (frames are stored as duration * 30)
      const durationInSeconds = Math.round(video.n_frames / 30);
      
      console.log(`Storyboard: n_frames=${video.n_frames}, calculated duration=${durationInSeconds}s`);
      
      kiePayload.input = {
        shots: [
          {
            description: video.prompt,
            duration: durationInSeconds,
          }
        ],
        n_frames: String(durationInSeconds), // Must be "10", "15", or "25"
        aspect_ratio: video.aspect_ratio === "16:9" ? "landscape" : "portrait",
        quality: "high",
      };

      // Add reference images if provided
      if (video.image_url) {
        try {
          const parsedPaths = JSON.parse(video.image_url);
          if (Array.isArray(parsedPaths) && parsedPaths.length > 0) {
            // Generate signed URLs for each path (valid for 1 hour)
            const signedUrls = await Promise.all(
              parsedPaths.map(async (path: string) => {
                const { data, error } = await supabase.storage
                  .from('video-inputs')
                  .createSignedUrl(path, 3600); // 1 hour expiry
                
                if (error) {
                  console.error('Error creating signed URL for path:', path, error);
                  throw new Error(`Failed to create signed URL: ${error.message}`);
                }
                return data.signedUrl;
              })
            );
            kiePayload.input.image_urls = signedUrls;
          }
        } catch (e) {
          // Single path (legacy format or single image)
          const { data, error } = await supabase.storage
            .from('video-inputs')
            .createSignedUrl(video.image_url, 3600);
          
          if (error) {
            console.error('Error creating signed URL:', error);
            throw new Error(`Failed to create signed URL: ${error.message}`);
          }
          kiePayload.input.image_urls = [data.signedUrl];
        }
      }
    } else {
      // Standard text-to-video or image-to-video models
      // Convert frames back to seconds for the API
      const durationInSeconds = Math.round(video.n_frames / 30);
      
      kiePayload.input = {
        prompt: video.prompt,
        aspect_ratio: video.aspect_ratio === "16:9" ? "landscape" : "portrait",
        n_frames: String(durationInSeconds),
        quality: "high",
      };

      // Handle image URLs for image-to-video models
      if (video.image_url && video.model.includes("image-to-video")) {
        // Generate signed URL (valid for 1 hour)
        const { data, error } = await supabase.storage
          .from('video-inputs')
          .createSignedUrl(video.image_url, 3600);
        
        if (error) {
          console.error('Error creating signed URL:', error);
          throw new Error(`Failed to create signed URL: ${error.message}`);
        }
        kiePayload.input.image_urls = [data.signedUrl];
      }
    }

    console.log("Payload being sent:", JSON.stringify(kiePayload, null, 2));

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
