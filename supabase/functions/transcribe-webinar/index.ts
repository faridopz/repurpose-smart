import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPPORTED_FORMATS = ['.mp3', '.wav', '.m4a'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const timings: Record<string, string> = {};

  try {
    // Step 1: Validate API Key
    const assemblyAiKey = Deno.env.get('ASSEMBLYAI_API_KEY');
    if (!assemblyAiKey) {
      console.error('ASSEMBLYAI_API_KEY not configured');
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'init',
          message: 'AssemblyAI API key not configured in environment variables'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Parse Input
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'init',
          message: 'Invalid JSON in request body'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileUrl } = body;
    
    if (!fileUrl) {
      console.error('No fileUrl provided');
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'init',
          message: 'Missing required parameter: fileUrl'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting transcription for file:', fileUrl);

    // Step 3: Validate File Format
    const fileExtension = fileUrl.toLowerCase().split('?')[0].match(/\.[^.]+$/)?.[0];
    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      console.error('Unsupported file format:', fileExtension);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'init',
          message: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Fetch File
    console.log('Fetching audio file...');
    const fetchStart = Date.now();
    
    let audioResponse;
    try {
      audioResponse = await fetch(fileUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch file: ${audioResponse.status} ${audioResponse.statusText}`);
      }
    } catch (e) {
      console.error('File fetch error:', e);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'fetch',
          message: `Failed to fetch file from URL: ${e instanceof Error ? e.message : 'Unknown error'}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    const audioBuffer = new Uint8Array(arrayBuffer);
    timings.file_fetch_time = `${((Date.now() - fetchStart) / 1000).toFixed(2)}s`;
    console.log(`File fetched in ${timings.file_fetch_time}`);

    // Step 5: Upload to AssemblyAI
    console.log('Uploading to AssemblyAI...');
    const uploadStart = Date.now();
    
    let uploadResponse;
    try {
      uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': assemblyAiKey,
          'Transfer-Encoding': 'chunked',
        },
        body: audioBuffer
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }
    } catch (e) {
      console.error('Upload error:', e);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'upload',
          message: `Failed to upload file to AssemblyAI: ${e instanceof Error ? e.message : 'Unknown error'}`,
          ...timings
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uploadData = await uploadResponse.json();
    const upload_url = uploadData.upload_url;
    
    if (!upload_url) {
      console.error('No upload_url in response:', uploadData);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'upload',
          message: 'AssemblyAI upload response missing upload_url',
          ...timings
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    timings.upload_time = `${((Date.now() - uploadStart) / 1000).toFixed(2)}s`;
    console.log(`File uploaded in ${timings.upload_time}`);

    // Step 6: Start Transcription
    console.log('Starting transcription job...');
    const transcriptStart = Date.now();
    
    let transcriptResponse;
    try {
      transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': assemblyAiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: upload_url,
          speaker_labels: true,
          auto_chapters: true,
          sentiment_analysis: true,
          entity_detection: true
        })
      });

      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text();
        throw new Error(`Transcription failed: ${transcriptResponse.status} - ${errorText}`);
      }
    } catch (e) {
      console.error('Transcription start error:', e);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'transcription',
          message: `Failed to start transcription: ${e instanceof Error ? e.message : 'Unknown error'}`,
          ...timings
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transcriptData = await transcriptResponse.json();
    const transcript_id = transcriptData.id;
    
    if (!transcript_id) {
      console.error('No transcript ID in response:', transcriptData);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'transcription',
          message: 'AssemblyAI transcription response missing ID',
          ...timings
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    timings.transcription_init_time = `${((Date.now() - transcriptStart) / 1000).toFixed(2)}s`;
    console.log(`Transcription started in ${timings.transcription_init_time} with ID: ${transcript_id}`);

    // Step 7: Success Response
    return new Response(
      JSON.stringify({
        status: 'success',
        step: 'completed',
        message: 'Transcription started successfully.',
        transcript_id,
        ...timings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        status: 'failed',
        step: 'internal',
        message: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ...timings
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});