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
    const { webinarId, platforms, tone, persona } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating content for webinar:', webinarId, 'platforms:', platforms, 'tone:', tone);

    // Get transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*, webinars(*)')
      .eq('webinar_id', webinarId)
      .single();

    if (transcriptError || !transcript) {
      throw new Error('Transcript not found');
    }

    const webinar = transcript.webinars;

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build persona context
    const personaContext = persona ? `Target audience: ${persona}. Adapt your language, examples, and complexity to resonate with this specific persona.` : '';
    
    // Generate blog post
    const blogPrompt = `You are an expert content strategist. Create a compelling 500-800 word blog post from this webinar transcript.

Tone: ${tone} - embody this tone throughout the writing.
${personaContext}

Webinar Title: ${webinar.title}
Transcript: ${transcript.full_text?.slice(0, 3000) || 'No transcript available'}

Write in a ${tone} tone. Make it engaging, actionable, and valuable for the reader.

Return ONLY valid JSON with this exact structure:
{
  "title": "Compelling blog post title",
  "subheadings": ["Subheading 1", "Subheading 2", "Subheading 3"],
  "body": "Full blog post content with paragraphs separated by \\n\\n",
  "takeaways": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"]
}`;

    const blogResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a professional content writer who creates platform-optimized marketing content. Always return valid JSON.' },
          { role: 'user', content: blogPrompt }
        ],
      }),
    });

    const blogData = await blogResponse.json();
    const blogContent = JSON.parse(blogData.choices[0].message.content);

    // Save blog post
    await supabase.from('ai_content').insert({
      webinar_id: webinarId,
      user_id: webinar.user_id,
      content_type: 'blog',
      platform: 'blog',
      tone: tone,
      persona: persona,
      content: JSON.stringify(blogContent),
      prompt_used: blogPrompt,
      model: 'google/gemini-2.5-flash'
    });

    // Generate social posts for each platform
    for (const platform of platforms) {
      let constraints = '';
      let platformGuidance = '';
      
      if (platform === 'linkedin') {
        constraints = '1-3 posts, each up to 1300 chars';
        platformGuidance = 'Professional yet engaging. Use line breaks for readability. Include a hook in the first line.';
      } else if (platform === 'twitter') {
        constraints = '3 tweet variations, each ≤280 chars';
        platformGuidance = 'Punchy and concise. Use strong hooks. Each tweet should work standalone.';
      } else if (platform === 'instagram') {
        constraints = '3 caption variations, each up to 2200 chars';
        platformGuidance = 'Visual storytelling style. Include 5-8 relevant hashtags. Use emojis strategically.';
      } else if (platform === 'facebook') {
        constraints = '3 post variations, each up to 1000 chars';
        platformGuidance = 'Conversational and community-focused. Encourage engagement with questions.';
      } else if (platform === 'youtube') {
        constraints = '3 description variations, each up to 5000 chars';
        platformGuidance = 'SEO-optimized with keywords. Include timestamp suggestions. Add CTAs and links section.';
      }

      const socialPrompt = `You are a ${platform} content expert. Create 3 distinct, platform-optimized posts.

Platform: ${platform}
Constraints: ${constraints}
Platform Style: ${platformGuidance}
Tone: ${tone} - maintain this tone consistently.
${personaContext}

Webinar Content: ${transcript.full_text?.slice(0, 1000) || 'No transcript available'}

Create 3 different approaches (e.g., storytelling, data-driven, inspirational) that would perform well on ${platform}.

Return ONLY valid JSON with this exact structure:
{
  "posts": [
    {"text": "Post content", "hashtags": ["hashtag1", "hashtag2"]},
    {"text": "Post content", "hashtags": ["hashtag1", "hashtag2"]},
    {"text": "Post content", "hashtags": ["hashtag1", "hashtag2"]}
  ]
}`;

      const socialResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a social media expert who creates engaging platform-specific content. Always return valid JSON.' },
            { role: 'user', content: socialPrompt }
          ],
        }),
      });

      const socialData = await socialResponse.json();
      const socialContent = JSON.parse(socialData.choices[0].message.content);

      // Save each post variant
      for (let i = 0; i < socialContent.posts.length; i++) {
        await supabase.from('ai_content').insert({
          webinar_id: webinarId,
          user_id: webinar.user_id,
          content_type: 'social',
          platform: platform,
          tone: tone,
          persona: persona,
          content: JSON.stringify(socialContent.posts[i]),
          prompt_used: socialPrompt,
          model: 'google/gemini-2.5-flash'
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Content generated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Content generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});