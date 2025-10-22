import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCacheKey(transcript: string, platforms: string[], tone: string): string {
  // Create hash-like key from inputs
  return `${transcript.slice(0, 100)}_${platforms.sort().join(',')}_${tone}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expires) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    expires: Date.now() + CACHE_TTL
  });
  
  // Clean old entries (keep cache size under 100)
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const timings: Record<string, number> = {};

  try {
    // 1. Validate API Key
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('Missing LOVABLE_API_KEY');
      return new Response(
        JSON.stringify({ status: "failed", step: "auth", error: "Missing Lovable AI API key" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse and validate input
    const { transcript, platforms, tone = "professional", persona } = await req.json();
    
    if (!transcript || typeof transcript !== 'string') {
      console.error('Missing or invalid transcript');
      return new Response(
        JSON.stringify({ status: "failed", step: "input", error: "Missing or invalid transcript field" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      console.error('Missing or invalid platforms');
      return new Response(
        JSON.stringify({ status: "failed", step: "input", error: "Missing or invalid platforms array" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting content generation for ${platforms.length} platform(s) with tone: ${tone}`);

    // Check cache first
    const cacheKey = getCacheKey(transcript, platforms, tone);
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      console.log('Returning cached result');
      return new Response(
        JSON.stringify({
          status: "success",
          generated: cachedResult,
          diagnostics: {
            cached: true,
            total_time_ms: Date.now() - startTime
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Truncate transcript if too long (keep first 10k characters)
    const truncatedTranscript = transcript.length > 10000 
      ? transcript.slice(0, 10000) + "\n\n...[transcript truncated for length]"
      : transcript;

    console.log(`Transcript length: ${transcript.length} chars (truncated to ${truncatedTranscript.length})`);

    // Build persona context
    const personaContext = persona 
      ? `Target audience: ${persona}. Adapt your language and messaging accordingly.`
      : '';

    // Build platform-specific instructions
    const platformInstructions = platforms.map(p => {
      switch (p) {
        case 'linkedin':
          return 'LinkedIn: 150-250 word professional post with line breaks. Strong hook, actionable insights.';
        case 'twitter':
          return 'Twitter: 3-tweet thread. Each ≤280 chars. Punchy hooks, standalone tweets that flow together.';
        case 'instagram':
          return 'Instagram: 1-2 sentence caption with 5-8 hashtags. Visual storytelling with strategic emojis.';
        case 'youtube':
          return 'YouTube: SEO-optimized description with timestamp suggestions and clear CTA.';
        case 'blog':
          return 'Blog: 500-800 word summary with title, 3 subheadings, body, and 3 key takeaways.';
        case 'summary':
          return 'Summary: 3-4 sentence executive summary of the main points.';
        default:
          return null;
      }
    }).filter(Boolean).join('\n');

    const systemPrompt = `You are an expert content strategist. Create platform-optimized content that is concise, distinct, and actionable. ${personaContext}`;

    const userPrompt = `Based on this transcript, create content for each requested platform.

TRANSCRIPT:
${truncatedTranscript}

PLATFORMS TO CREATE:
${platformInstructions}

TONE: ${tone}

Create concise, distinct content for each platform. Be specific and actionable.`;

    console.log('Generating all platform content in one API call...');

    try {
      // Use tool calling for structured output
      const aiStart = Date.now();
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
            { role: 'user', content: userPrompt }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'create_platform_content',
              description: 'Generate content optimized for specific platforms',
              parameters: {
                type: 'object',
                properties: {
                  linkedin: { 
                    type: 'string', 
                    description: 'LinkedIn post (150-250 words, professional tone)' 
                  },
                  twitter: { 
                    type: 'string', 
                    description: '3-tweet thread, each ≤280 chars' 
                  },
                  instagram: { 
                    type: 'string', 
                    description: 'Short caption with hashtags' 
                  },
                  youtube: { 
                    type: 'string', 
                    description: 'SEO-optimized video description' 
                  },
                  blog: { 
                    type: 'string', 
                    description: 'Blog post summary (500-800 words)' 
                  },
                  summary: { 
                    type: 'string', 
                    description: '3-4 sentence executive summary' 
                  }
                },
                required: platforms,
                additionalProperties: false
              }
            }
          }],
          tool_choice: { 
            type: 'function', 
            function: { name: 'create_platform_content' } 
          }
        }),
      });

      timings.ai_generation_ms = Date.now() - aiStart;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ status: "failed", step: "generation", error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ status: "failed", step: "generation", error: "Payment required. Please add credits to your Lovable AI workspace." }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        throw new Error(`AI API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

      if (!toolCall || !toolCall.function?.arguments) {
        throw new Error('No tool call response from AI');
      }

      const generated = JSON.parse(toolCall.function.arguments);
      console.log(`Content generated for ${Object.keys(generated).length} platforms in ${timings.ai_generation_ms}ms`);

      // Cache the result
      setCache(cacheKey, generated);

      // Calculate total time and token estimate
      const totalTime = Date.now() - startTime;
      const tokensEstimate = Math.ceil(truncatedTranscript.length / 4);

      console.log(`Content generation completed in ${totalTime}ms`);

      // Return success response
      return new Response(
        JSON.stringify({
          status: "success",
          generated: generated,
          diagnostics: {
            cached: false,
            total_time_ms: totalTime,
            tokens_used_estimate: tokensEstimate,
            platforms_generated: Object.keys(generated).length,
            ...timings
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('AI generation error:', error);
      return new Response(
        JSON.stringify({ 
          status: "failed", 
          step: "generation", 
          error: `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Content generation error:', error);
    const totalTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({ 
        status: "failed", 
        step: "unknown", 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        diagnostics: {
          total_time_ms: totalTime
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
