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

    // Generate blog post
    const blogPrompt = `You are a professional content writer. Create a 500-800 word blog post based on this webinar transcript. 
Tone: ${tone}. ${persona ? `Persona: ${persona}.` : ''}
Transcript: ${transcript.full_text || 'No transcript available'}

Return ONLY valid JSON with this exact structure:
{
  "title": "Blog post title",
  "subheadings": ["Subheading 1", "Subheading 2", "Subheading 3"],
  "body": "Full blog post content with paragraphs",
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
      if (platform === 'linkedin') constraints = 'up to 1300 chars, professional tone';
      else if (platform === 'twitter') constraints = 'thread of up to 4 tweets, each <= 280 chars';
      else if (platform === 'instagram') constraints = 'caption up to 2200 chars, include 3-6 hashtags';
      else if (platform === 'facebook') constraints = 'engaging post up to 1000 chars';
      else if (platform === 'youtube') constraints = 'video description up to 5000 chars, include timestamps';

      const socialPrompt = `Create 3 platform-optimized posts for ${platform}.
Constraints: ${constraints}
Tone: ${tone}. ${persona ? `Persona: ${persona}.` : ''}
Transcript summary: ${transcript.full_text?.slice(0, 500) || 'No transcript available'}

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