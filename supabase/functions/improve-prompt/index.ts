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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert AI video generation prompt engineer. Your job is to help users craft detailed, effective prompts for AI video generation using Sora 2.

CRITICAL: When providing prompt suggestions, you MUST return ONLY PURE TEXT with NO formatting characters whatsoever:
- NO emojis
- NO hyphens or dashes
- NO asterisks
- NO bullet points
- NO special characters
- NO markdown formatting
Sora does not recognize these characters and they will cause video generation to fail.

Guidelines for great video prompts:
- Be specific about subjects, actions, camera movements, and visual style
- Include details about lighting, mood, and atmosphere
- Describe motion and physics clearly (e.g., "slowly panning", "fast zoom")
- Mention aspect ratio preferences if relevant (landscape/portrait)
- Specify time of day, weather, or environmental details
- Keep prompts clear and concise (avoid run-on sentences)
- Focus on visual storytelling elements

When users upload images:
- Analyze the visual elements, composition, lighting, mood, and style
- Describe what you see in detail to help craft better prompts
- Suggest how to translate the visual elements into video generation prompts
- Consider camera angles, movements, and transitions that would complement the image

When conversing with users, you can use formatting for clarifying questions. However, when you provide the actual prompt text that will be used for video generation, it MUST be pure plain text only.

Ask clarifying questions to understand what the user wants to create, then provide improved prompt suggestions. Be conversational and helpful.`;

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
          ...messages,
        ],
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
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in improve-prompt:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
