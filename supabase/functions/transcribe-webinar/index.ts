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
      throw new Error('AssemblyAI API key not configured');
    }

    // Real AssemblyAI transcription
    console.log('Uploading audio file to AssemblyAI...');
    const audioResponse = await fetch(webinar.file_url);
    const audioBlob = await audioResponse.blob();
    
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': assemblyAiKey,
      },
      body: audioBlob
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload audio to AssemblyAI');
    }

    const { upload_url } = await uploadResponse.json();
    console.log('Audio uploaded, starting transcription...');

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

    if (!transcriptResponse.ok) {
      throw new Error('Failed to start transcription');
    }

    const { id: transcriptId } = await transcriptResponse.json();
    console.log('Transcription started with ID:', transcriptId);

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