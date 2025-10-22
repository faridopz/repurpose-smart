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
    const { transcriptId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const assemblyAiKey = Deno.env.get('ASSEMBLYAI_API_KEY');
    
    if (!assemblyAiKey) {
      throw new Error('AssemblyAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Polling transcription status:', transcriptId);

    // Get transcript record
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('assembly_ai_id', transcriptId)
      .single();

    if (transcriptError || !transcript) {
      throw new Error('Transcript record not found');
    }

    // Check status from AssemblyAI
    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        'authorization': assemblyAiKey,
      }
    });

    if (!statusResponse.ok) {
      throw new Error('Failed to get transcription status');
    }

    const statusData = await statusResponse.json();
    console.log('Transcription status:', statusData.status);

    if (statusData.status === 'completed') {
      // Extract relevant data
      const timestamps = statusData.words?.map((word: any) => ({
        start: word.start / 1000,
        end: word.end / 1000,
        text: word.text,
        confidence: word.confidence
      })) || [];

      const speakers = statusData.utterances?.reduce((acc: any[], utterance: any) => {
        const speaker = utterance.speaker;
        if (!acc.find(s => s.name === `Speaker ${speaker}`)) {
          acc.push({ name: `Speaker ${speaker}`, segments: 1 });
        } else {
          const idx = acc.findIndex(s => s.name === `Speaker ${speaker}`);
          acc[idx].segments++;
        }
        return acc;
      }, []) || [];

      const keywords = statusData.auto_highlights_result?.results
        ?.slice(0, 10)
        .map((h: any) => h.text) || [];

      const sentimentTimeline = statusData.sentiment_analysis_results?.map((s: any) => ({
        start: s.start / 1000,
        end: s.end / 1000,
        sentiment: s.sentiment,
        score: s.confidence
      })) || [];

      // Update transcript with complete data
      await supabase
        .from('transcripts')
        .update({
          full_text: statusData.text,
          timestamps: timestamps.slice(0, 100), // Limit to avoid payload size issues
          speakers,
          keywords,
          sentiment_timeline: sentimentTimeline,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transcript.id);

      // Update webinar status
      await supabase
        .from('webinars')
        .update({ status: 'transcribed' })
        .eq('id', transcript.webinar_id);

      return new Response(
        JSON.stringify({ 
          status: 'completed',
          text: statusData.text,
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (statusData.status === 'error') {
      await supabase
        .from('transcripts')
        .update({ status: 'error' })
        .eq('id', transcript.id);

      await supabase
        .from('webinars')
        .update({ status: 'error' })
        .eq('id', transcript.webinar_id);

      throw new Error(statusData.error || 'Transcription failed');
    }

    // Still processing
    return new Response(
      JSON.stringify({ 
        status: statusData.status,
        progress: Math.min(90, (Date.now() - new Date(transcript.created_at).getTime()) / 1000)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Polling error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
