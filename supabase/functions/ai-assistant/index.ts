import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build context-aware system prompt
    let systemPrompt = `You are an expert content strategist and marketing assistant for WebinarAI. You help users:
- Write and optimize social media captions for LinkedIn, Twitter, Instagram, YouTube, and Facebook
- Rephrase content in different tones (professional, conversational, witty, persuasive, empathetic, bold)
- Suggest content themes and strategies
- Auto-tag clips with relevant themes (e.g., "Motivational", "Educational", "Product Demo", "Thought Leadership")
- Provide creative content ideas based on webinar transcripts and clips

You are concise, actionable, and creative. Always adapt to the requested tone and platform.`;

    // Add user context if provided
    if (context) {
      if (context.webinarTitle) {
        systemPrompt += `\n\nCurrent webinar: "${context.webinarTitle}"`;
      }
      if (context.transcript) {
        systemPrompt += `\n\nTranscript excerpt: ${context.transcript.slice(0, 500)}...`;
      }
      if (context.clips && context.clips.length > 0) {
        systemPrompt += `\n\nAvailable clips: ${context.clips.map((c: any) => c.transcript_chunk?.slice(0, 100)).join('; ')}`;
      }
      if (context.generatedContent && context.generatedContent.length > 0) {
        systemPrompt += `\n\nExisting generated content: ${context.generatedContent.slice(0, 200)}`;
      }
    }

    console.log('AI Assistant request with context:', context ? 'yes' : 'no');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI gateway error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('AI assistant error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
