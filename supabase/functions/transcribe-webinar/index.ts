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

  const startTime = Date.now();
  const diagnostics: Record<string, number> = {};

  try {
    // Step 1: Validate API Key
    console.log('[AUTH] Validating AssemblyAI API key...');
    const assemblyAiKey = Deno.env.get('ASSEMBLYAI_API_KEY');
    if (!assemblyAiKey) {
      console.error('[AUTH] ASSEMBLYAI_API_KEY not configured');
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'auth',
          error: 'Missing or invalid AssemblyAI API key'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Parse Input
    console.log('[INPUT] Parsing request body...');
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('[INPUT] Failed to parse request body:', e);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'input',
          error: 'Invalid JSON in request body'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileUrl } = body;
    
    if (!fileUrl) {
      console.error('[INPUT] No fileUrl provided');
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'input',
          error: 'Missing required parameter: fileUrl'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[INPUT] Processing file: ${fileUrl}`);

    // Step 3: Validate File Format
    const fileExtension = fileUrl.toLowerCase().split('?')[0].match(/\.[^.]+$/)?.[0];
    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      console.error(`[VALIDATION] Unsupported file format: ${fileExtension}`);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'validation',
          error: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Determine if we need to upload or can use direct URL
    let audioUrl: string;
    
    // Check if URL is already publicly accessible (not Supabase storage with auth)
    const isPublicUrl = !fileUrl.includes('/storage/v1/object/sign/');
    
    if (isPublicUrl) {
      console.log('[UPLOAD] URL appears public, attempting direct use...');
      // Try to use the URL directly
      audioUrl = fileUrl;
      diagnostics.upload_time_ms = 0;
    } else {
      // Need to fetch and upload to AssemblyAI
      console.log('[UPLOAD] Fetching file from storage...');
      const fetchStart = Date.now();
      
      let audioResponse;
      try {
        audioResponse = await fetch(fileUrl);
        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch file: ${audioResponse.status} ${audioResponse.statusText}`);
        }
      } catch (e) {
        console.error('[UPLOAD] File fetch error:', e);
        return new Response(
          JSON.stringify({
            status: 'failed',
            step: 'upload',
            error: `Failed to fetch file from URL: ${e instanceof Error ? e.message : 'Unknown error'}`,
            diagnostics
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const fetchTime = Date.now() - fetchStart;
      console.log(`[UPLOAD] File fetched in ${fetchTime}ms`);

      // Stream upload to AssemblyAI (low memory usage)
      console.log('[UPLOAD] Streaming file to AssemblyAI...');
      const uploadStart = Date.now();
      
      let uploadResponse;
      try {
        // Stream the body directly instead of buffering in memory
        uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
          method: 'POST',
          headers: {
            'authorization': assemblyAiKey,
            'Transfer-Encoding': 'chunked',
          },
          body: audioResponse.body // Stream directly, no buffering
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
        }
        
        console.log('[UPLOAD] Stream upload successful');
      } catch (e) {
        console.error('[UPLOAD] Upload error:', e);
        return new Response(
          JSON.stringify({
            status: 'failed',
            step: 'upload',
            error: `Failed to upload file to AssemblyAI: ${e instanceof Error ? e.message : 'Unknown error'}`,
            diagnostics: { ...diagnostics, fetch_time_ms: fetchTime }
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const uploadData = await uploadResponse.json();
      audioUrl = uploadData.upload_url;
      
      if (!audioUrl) {
        console.error('[UPLOAD] No upload_url in response:', uploadData);
        return new Response(
          JSON.stringify({
            status: 'failed',
            step: 'upload',
            error: 'AssemblyAI upload response missing upload_url',
            diagnostics
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      diagnostics.upload_time_ms = Date.now() - uploadStart;
      console.log(`[UPLOAD] File uploaded in ${diagnostics.upload_time_ms}ms`);
    }

    // Step 5: Start Transcription
    console.log('[TRANSCRIBE] Starting transcription job...');
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
          audio_url: audioUrl,
          speaker_labels: true,
          auto_chapters: true,
          sentiment_analysis: true,
          entity_detection: true
        })
      });

      console.log(`[TRANSCRIBE] API response status: ${transcriptResponse.status}`);

      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text();
        throw new Error(`Transcription failed: ${transcriptResponse.status} - ${errorText}`);
      }
    } catch (e) {
      console.error('[TRANSCRIBE] Transcription start error:', e);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'transcribe',
          error: `Failed to start transcription: ${e instanceof Error ? e.message : 'Bad request or network timeout'}`,
          diagnostics
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transcriptData = await transcriptResponse.json();
    const transcript_id = transcriptData.id;
    
    if (!transcript_id) {
      console.error('[TRANSCRIBE] No transcript ID in response:', transcriptData);
      return new Response(
        JSON.stringify({
          status: 'failed',
          step: 'transcribe',
          error: 'AssemblyAI transcription response missing ID',
          diagnostics
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    diagnostics.api_response_ms = Date.now() - transcriptStart;
    const totalDuration = Date.now() - startTime;
    
    console.log(`[TRANSCRIBE] Transcription started in ${diagnostics.api_response_ms}ms with ID: ${transcript_id}`);
    console.log(`[SUCCESS] Total duration: ${totalDuration}ms`);

    // Success Response
    return new Response(
      JSON.stringify({
        status: 'success',
        transcript_id,
        duration_ms: totalDuration,
        diagnostics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERROR] Unexpected error:', error);
    const totalDuration = Date.now() - startTime;
    return new Response(
      JSON.stringify({
        status: 'failed',
        step: 'unknown',
        error: `Unexpected runtime error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        diagnostics: { ...diagnostics, duration_ms: totalDuration }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});