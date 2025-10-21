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
    const { webinarId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Suggesting highlights for webinar:', webinarId);

    // Get transcript with enrichment
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*, webinars(*)')
      .eq('webinar_id', webinarId)
      .single();

    if (transcriptError || !transcript) {
      throw new Error('Transcript not found');
    }

    const webinar = transcript.webinars;

    // Analyze sentiment timeline and keywords to find highlights
    const sentimentTimeline = transcript.sentiment_timeline || [];
    const quotes = transcript.quotes || [];
    
    // Find sentiment peaks
    const highlights = [];
    
    if (sentimentTimeline.length > 0) {
      // Sort by sentiment score
      const sortedSentiment = [...sentimentTimeline].sort((a, b) => b.score - a.score);
      
      // Take top 5 sentiment peaks
      for (let i = 0; i < Math.min(5, sortedSentiment.length); i++) {
        const segment = sortedSentiment[i];
        const duration = Math.min(60, segment.end - segment.start); // Max 60 seconds
        
        highlights.push({
          webinar_id: webinarId,
          user_id: webinar.user_id,
          start_time: segment.start,
          end_time: segment.start + duration,
          reason: `High ${segment.sentiment} sentiment (score: ${segment.score.toFixed(2)})`,
          transcript_chunk: transcript.full_text?.slice(
            Math.max(0, segment.start * 10),
            segment.end * 10
          ) || '',
          tags: [segment.sentiment, 'auto-suggested'],
          status: 'suggested'
        });
      }
    }

    // Add quote-based highlights
    if (quotes.length > 0) {
      for (let i = 0; i < Math.min(3, quotes.length); i++) {
        highlights.push({
          webinar_id: webinarId,
          user_id: webinar.user_id,
          start_time: i * 60, // Placeholder timing
          end_time: i * 60 + 30,
          reason: 'Key quote',
          transcript_chunk: quotes[i],
          tags: ['quote', 'auto-suggested'],
          status: 'suggested'
        });
      }
    }

    // Save highlights to database
    if (highlights.length > 0) {
      const { error: insertError } = await supabase
        .from('snippets')
        .insert(highlights);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: highlights.length,
        message: `${highlights.length} highlights suggested` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Highlight suggestion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});