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
    const { webinarId, clipContext } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating smart clips for webinar:', webinarId, 'with context:', clipContext);

    // Get transcript and webinar data
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*, webinars(*)')
      .eq('webinar_id', webinarId)
      .single();

    if (transcriptError || !transcript) {
      throw new Error('Transcript not found');
    }

    const webinar = transcript.webinars;

    // Build AI prompt for clip identification
    const systemPrompt = `You are an expert video editor who identifies the most engaging and valuable moments from transcripts.
Analyze the transcript and identify 3-7 key moments that would make excellent short video clips (30-90 seconds each).

Focus on:
- Emotional peaks (inspiration, humor, insight)
- Key takeaways or actionable advice
- Quotable moments
- Story highlights
- Surprising facts or revelations

${clipContext ? `User context: ${clipContext}` : ''}

For each clip, provide:
1. start_time (in seconds)
2. end_time (in seconds, 30-90 sec duration)
3. title (catchy, 5-8 words)
4. category (Motivational, Insightful, Funny, Educational, Story, or Quote)
5. reason (why this moment is valuable)
6. transcript_excerpt (the key part of the transcript)

Return ONLY a valid JSON array with no additional text.`;

    const userPrompt = `Transcript:\n\n${transcript.full_text}\n\nSentiment timeline: ${JSON.stringify(transcript.sentiment_timeline || [])}\n\nKeywords: ${JSON.stringify(transcript.keywords || [])}`;

    // Call OpenAI to analyze and identify clips
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to analyze transcript for clips');
    }

    const openaiData = await openaiResponse.json();
    const clipSuggestions = JSON.parse(openaiData.choices[0].message.content);

    console.log('AI identified', clipSuggestions.length, 'clips');

    // Prepare clip records for database
    const clipRecords = clipSuggestions.map((clip: any) => ({
      webinar_id: webinarId,
      user_id: webinar.user_id,
      start_time: clip.start_time,
      end_time: clip.end_time,
      reason: clip.title,
      transcript_chunk: clip.transcript_excerpt,
      tags: [clip.category.toLowerCase(), 'ai-generated', clipContext?.toLowerCase()].filter(Boolean),
      status: 'suggested',
      url: null, // Will be generated when user exports/downloads
      thumbnail_url: null,
    }));

    // Insert clips into database
    const { data: insertedClips, error: insertError } = await supabase
      .from('snippets')
      .insert(clipRecords)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Successfully created', insertedClips.length, 'smart clips');

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: insertedClips.length,
        clips: insertedClips,
        message: `${insertedClips.length} smart clips generated successfully` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart clip generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
