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
    const assemblyAiKey = Deno.env.get('ASSEMBLYAI_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting transcription for webinar:', webinarId);

    // Get webinar details
    const { data: webinar, error: webinarError } = await supabase
      .from('webinars')
      .select('*')
      .eq('id', webinarId)
      .single();

    if (webinarError || !webinar) {
      throw new Error('Webinar not found');
    }

    // Update webinar status
    await supabase
      .from('webinars')
      .update({ status: 'transcribing' })
      .eq('id', webinarId);

    if (!assemblyAiKey) {
      console.log('No AssemblyAI key - using mock data');
      
      // Create mock transcript with enrichment
      const mockTranscript = {
        id: webinarId,
        webinar_id: webinarId,
        user_id: webinar.user_id,
        full_text: `This is a mock transcript for ${webinar.title}. In this webinar, we discussed key topics including innovation, technology trends, and best practices. The speaker emphasized the importance of continuous learning and adapting to market changes.`,
        timestamps: [
          { start: 0, end: 30, text: "Welcome everyone to today's webinar.", speaker: "Speaker 1" },
          { start: 30, end: 90, text: "We'll be discussing innovation and technology trends.", speaker: "Speaker 1" },
          { start: 90, end: 180, text: "Let's dive into the key topics for today.", speaker: "Speaker 1" }
        ],
        speakers: [{ name: "Speaker 1", segments: 3 }],
        keywords: ['innovation', 'technology', 'learning', 'best practices', 'market trends'],
        sentiment_timeline: [
          { start: 0, end: 30, sentiment: 'positive', score: 0.8 },
          { start: 30, end: 90, sentiment: 'neutral', score: 0.5 },
          { start: 90, end: 180, sentiment: 'positive', score: 0.9 }
        ],
        quotes: [
          "Innovation is the key to staying competitive",
          "Continuous learning is essential in today's market",
          "Adapt or get left behind"
        ],
        status: 'completed',
        assembly_ai_id: 'mock_' + Date.now()
      };

      const { error: transcriptError } = await supabase
        .from('transcripts')
        .insert(mockTranscript);

      if (transcriptError) throw transcriptError;

      // Update webinar status
      await supabase
        .from('webinars')
        .update({ status: 'transcribed' })
        .eq('id', webinarId);

      return new Response(
        JSON.stringify({ success: true, message: 'Mock transcript created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Real AssemblyAI transcription
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': assemblyAiKey,
      },
      body: await fetch(webinar.file_url).then(r => r.blob())
    });

    const { upload_url } = await uploadResponse.json();

    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': assemblyAiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: upload_url,
        speaker_labels: true,
        auto_highlights: true,
        sentiment_analysis: true,
        entity_detection: true
      })
    });

    const { id: transcriptId } = await transcriptResponse.json();

    // Save initial transcript record
    await supabase
      .from('transcripts')
      .insert({
        webinar_id: webinarId,
        user_id: webinar.user_id,
        assembly_ai_id: transcriptId,
        status: 'processing'
      });

    return new Response(
      JSON.stringify({ success: true, transcriptId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});