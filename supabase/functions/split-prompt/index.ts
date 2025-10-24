import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an AI that splits video prompts into multiple scenes for storyboard creation.

Given a video prompt, analyze it and split it into 2-5 logical scenes. Each scene should:
- Have a clear description of what happens
- Be visually distinct from other scenes
- Flow naturally from one to the next
- Be roughly equal in duration (you'll suggest durations that sum to the total)

Return your response as a JSON object with a "scenes" array. Each scene should have:
- description: string (detailed scene description)
- suggestedDuration: number (in seconds, typically 3-7 seconds per scene)

Example format:
{
  "scenes": [
    {
      "description": "Wide shot of a sunset over the ocean, warm golden light reflecting on calm waves",
      "suggestedDuration": 5
    },
    {
      "description": "Close-up of a seagull gliding through the air, silhouetted against the orange sky",
      "suggestedDuration": 4
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Split this video prompt into scenes:\n\n${prompt}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let parsedScenes;
    try {
      parsedScenes = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid response format from AI");
    }

    // Transform the scenes to match our expected format
    const scenes = parsedScenes.scenes.map((scene: any) => ({
      description: scene.description,
      duration: scene.suggestedDuration || 5,
    }));
    
    return new Response(JSON.stringify({ scenes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in split-prompt:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
