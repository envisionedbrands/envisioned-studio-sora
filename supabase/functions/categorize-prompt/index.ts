import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Categorizing prompt:', prompt.substring(0, 100));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a categorization assistant. Analyze video generation prompts and categorize them into one of these categories: Nature, Urban, Action, People, Abstract, Animals, Fantasy, Technology, Food, Travel, Architecture, Fashion, Sports, Art, Music. Return ONLY the category name, nothing else.'
          },
          {
            role: 'user',
            content: `Categorize this video prompt: "${prompt}"`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'categorize_prompt',
              description: 'Categorize a video generation prompt',
              parameters: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    enum: ['Nature', 'Urban', 'Action', 'People', 'Abstract', 'Animals', 'Fantasy', 'Technology', 'Food', 'Travel', 'Architecture', 'Fashion', 'Sports', 'Art', 'Music'],
                    description: 'The most appropriate category for this prompt'
                  }
                },
                required: ['category'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'categorize_prompt' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response');
      return new Response(
        JSON.stringify({ category: 'Uncategorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const args = JSON.parse(toolCall.function.arguments);
    const category = args.category || 'Uncategorized';

    console.log('Categorized as:', category);

    return new Response(
      JSON.stringify({ category }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in categorize-prompt function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        category: 'Uncategorized'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
