import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Truncate transcript if too long (keep first 10k characters)
    const truncatedTranscript = transcript.length > 10000 
      ? transcript.slice(0, 10000) + "\n\n...[transcript truncated for length]"
      : transcript;

    console.log(`Transcript length: ${transcript.length} chars (truncated to ${truncatedTranscript.length})`);

    // 4. Build persona context
    const personaContext = persona 
      ? `\n\nTARGET PERSONA: ${persona}\nAdapt your language, examples, and messaging to resonate specifically with this audience.`
      : '';

    // 5. Generate content for each platform
    const generated: Record<string, any> = {};
    
    for (const platform of platforms) {
      const platformStart = Date.now();
      
      let prompt = '';
      let constraints = '';
      
      if (platform === 'linkedin') {
        constraints = 'Write a long-form LinkedIn post (150-250 words)';
        prompt = `${constraints}. Professional yet engaging tone. Use line breaks for readability. Start with a strong hook.`;
      } else if (platform === 'twitter') {
        constraints = 'Write a 3-tweet thread';
        prompt = `${constraints}. Each tweet must be ≤280 characters. Punchy, concise, with strong hooks. Each tweet should work standalone but flow together.`;
      } else if (platform === 'instagram') {
        constraints = 'Write an Instagram caption';
        prompt = `${constraints}. 1-2 sentences max. Visual storytelling style. Include 5-8 relevant hashtags. Use emojis strategically.`;
      } else if (platform === 'youtube') {
        constraints = 'Write a YouTube video description';
        prompt = `${constraints}. SEO-optimized. Include key timestamps suggestions and a clear CTA.`;
      } else if (platform === 'blog') {
        constraints = 'Write a blog post summary (500-800 words)';
        prompt = `${constraints}. Include a compelling title, 3 subheadings, main body, and 3 key takeaways.`;
      } else {
        console.warn(`Unknown platform: ${platform}, skipping`);
        continue;
      }

      const fullPrompt = `You are a content strategist. Based on the following webinar transcript, create ${platform}-optimized content.

TONE: ${tone}${personaContext}

TRANSCRIPT:
${truncatedTranscript}

TASK: ${prompt}

Return your response as valid JSON with appropriate structure for the platform.`;

      console.log(`Generating content for ${platform}...`);

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are an expert content strategist who creates platform-optimized content. Always respond with clear, actionable content.' },
              { role: 'user', content: fullPrompt }
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI API error for ${platform}:`, response.status, errorText);
          
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
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('No content returned from AI');
        }

        generated[platform] = content;
        
        const platformTime = Date.now() - platformStart;
        timings[`${platform}_generation_ms`] = platformTime;
        console.log(`${platform} content generated in ${platformTime}ms`);

      } catch (error) {
        console.error(`Error generating content for ${platform}:`, error);
        return new Response(
          JSON.stringify({ 
            status: "failed", 
            step: "generation", 
            error: `Failed to generate content for ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            platform: platform
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Calculate total time and token estimate
    const totalTime = Date.now() - startTime;
    const tokensEstimate = Math.ceil(truncatedTranscript.length / 4); // rough estimate

    console.log(`Content generation completed in ${totalTime}ms for ${platforms.length} platforms`);

    // 7. Return success response
    return new Response(
      JSON.stringify({
        status: "success",
        generated: generated,
        diagnostics: {
          total_time_ms: totalTime,
          tokens_used_estimate: tokensEstimate,
          platforms_generated: platforms.length,
          ...timings
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
