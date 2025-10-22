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
    
    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    // Create supabase client with service role for operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create client with user token for auth checks
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    console.log('Generating smart clips for webinar:', webinarId, 'with context:', clipContext);
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check user's role and clip limits
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const role = userRole?.role || 'free';
    
    // Check monthly clip limit
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('clips_generated_this_month, last_clip_reset_date')
      .eq('id', user.id)
      .single();
    
    // Reset counter if new month
    const lastReset = profile?.last_clip_reset_date ? new Date(profile.last_clip_reset_date) : new Date();
    const now = new Date();
    const shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
    
    let clipsGeneratedThisMonth = profile?.clips_generated_this_month || 0;
    if (shouldReset) {
      clipsGeneratedThisMonth = 0;
      await supabaseAdmin
        .from('profiles')
        .update({ 
          clips_generated_this_month: 0, 
          last_clip_reset_date: now.toISOString() 
        })
        .eq('id', user.id);
    }
    
    // Check limits
    const limits: Record<string, number> = {
      'free': 5,
      'pro': 30,
      'enterprise': -1, // unlimited
    };
    
    const monthlyLimit = limits[role] || 5;
    if (monthlyLimit !== -1 && clipsGeneratedThisMonth >= monthlyLimit) {
      return new Response(
        JSON.stringify({ 
          error: `Monthly clip limit reached (${monthlyLimit}). Upgrade to Pro for more clips.`,
          limitReached: true,
          currentPlan: role 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Call Lovable AI to analyze and identify clips
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'suggest_clips',
            description: 'Return 3-7 video clip suggestions from transcript',
            parameters: {
              type: 'object',
              properties: {
                clips: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      start_time: { type: 'number', description: 'Start time in seconds' },
                      end_time: { type: 'number', description: 'End time in seconds (30-90s duration)' },
                      title: { type: 'string', description: 'Catchy title, 5-8 words' },
                      category: { type: 'string', enum: ['Motivational', 'Insightful', 'Funny', 'Educational', 'Story', 'Quote'] },
                      reason: { type: 'string', description: 'Why this moment is valuable' },
                      transcript_excerpt: { type: 'string', description: 'Key part of transcript' }
                    },
                    required: ['start_time', 'end_time', 'title', 'category', 'reason', 'transcript_excerpt']
                  }
                }
              },
              required: ['clips']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'suggest_clips' } }
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error('AI API error:', error);
      if (aiResponse.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error('Failed to analyze transcript for clips');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'suggest_clips') {
      throw new Error('AI did not return clip suggestions in expected format');
    }
    
    const clipSuggestions = JSON.parse(toolCall.function.arguments).clips;

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
      url: null,
      thumbnail_url: null,
    }));

    // Insert clips into database using admin client
    const { data: insertedClips, error: insertError } = await supabaseAdmin
      .from('snippets')
      .insert(clipRecords)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Update user's monthly clip counter
    await supabaseAdmin
      .from('profiles')
      .update({ 
        clips_generated_this_month: clipsGeneratedThisMonth + clipSuggestions.length 
      })
      .eq('id', user.id);

    console.log('Successfully created', insertedClips.length, 'smart clips');

    // Start background task for FFmpeg video clipping (async, non-blocking)
    // Process clips in background without blocking response
    processVideoClips(webinar.file_url, insertedClips, supabaseAdmin)
      .catch(err => console.error('Background video processing error:', err));

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: insertedClips.length,
        clips: insertedClips,
        message: `${insertedClips.length} smart clips generated! Video processing started in background.`,
        remainingClips: monthlyLimit === -1 ? -1 : monthlyLimit - (clipsGeneratedThisMonth + clipSuggestions.length)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart clip generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Background video processing with FFmpeg
async function processVideoClips(videoUrl: string, clips: any[], supabase: any) {
  console.log('Starting background video processing for', clips.length, 'clips');
  
  for (const clip of clips) {
    try {
      console.log(`Processing clip ${clip.id}: ${clip.start_time}s - ${clip.end_time}s`);
      
      // Download source media file
      const mediaResponse = await fetch(videoUrl);
      if (!mediaResponse.ok) {
        throw new Error('Failed to download source media');
      }
      
      const mediaBuffer = await mediaResponse.arrayBuffer();
      
      // Detect file type from URL or content-type
      const contentType = mediaResponse.headers.get('content-type') || '';
      const isAudio = contentType.includes('audio') || videoUrl.match(/\.(mp3|wav|m4a)$/i);
      const fileExtension = isAudio ? '.mp3' : '.mp4';
      
      const tempMediaPath = `/tmp/source_${clip.id}${fileExtension}`;
      const outputPath = `/tmp/clip_${clip.id}.mp4`;
      
      // Write media to temp file
      await Deno.writeFile(tempMediaPath, new Uint8Array(mediaBuffer));
      
      // Run FFmpeg to extract clip
      const duration = clip.end_time - clip.start_time;
      
      // For audio files, convert to video with waveform visualization
      // For video files, use stream copy for efficiency
      const ffmpegArgs = isAudio ? [
        "-ss", clip.start_time.toString(),
        "-i", tempMediaPath,
        "-t", duration.toString(),
        "-filter_complex", "[0:a]showwaves=s=1280x720:mode=line:colors=0x6366f1,format=yuv420p[v]",
        "-map", "[v]",
        "-map", "0:a",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-preset", "fast",
        "-crf", "23",
        outputPath
      ] : [
        "-ss", clip.start_time.toString(),
        "-i", tempMediaPath,
        "-t", duration.toString(),
        "-c", "copy", // Copy streams for video, no re-encode
        "-avoid_negative_ts", "make_zero",
        outputPath
      ];
      
      const ffmpegCommand = new Deno.Command("ffmpeg", {
        args: ffmpegArgs,
        stdout: "piped",
        stderr: "piped",
      });
      
      const process = await ffmpegCommand.output();
      
      if (!process.success) {
        const error = new TextDecoder().decode(process.stderr);
        console.error('FFmpeg error for clip', clip.id, ':', error);
        
        // Fallback: try without stream copy (re-encode) if copy failed
        if (!isAudio) {
          console.log('Retrying with re-encode for clip', clip.id);
          const fallbackArgs = [
            "-ss", clip.start_time.toString(),
            "-i", tempMediaPath,
            "-t", duration.toString(),
            "-c:v", "libx264",
            "-c:a", "aac",
            "-preset", "fast",
            "-crf", "23",
            outputPath
          ];
          
          const fallbackCommand = new Deno.Command("ffmpeg", {
            args: fallbackArgs,
            stdout: "piped",
            stderr: "piped",
          });
          
          const fallbackProcess = await fallbackCommand.output();
          if (!fallbackProcess.success) {
            console.error('Fallback FFmpeg also failed for clip', clip.id);
            continue;
          }
        } else {
          continue; // Skip this clip if audio processing failed
        }
      }
      
      // Read processed clip
      const clipData = await Deno.readFile(outputPath);
      
      // Upload to Supabase storage
      const fileName = `${clip.id}_${clip.start_time}-${clip.end_time}.mp4`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('webinars')
        .upload(`clips/${fileName}`, clipData, {
          contentType: 'video/mp4',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Upload error for clip', clip.id, ':', uploadError);
        continue;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('webinars')
        .getPublicUrl(`clips/${fileName}`);
      
      // Update snippet with video URL
      await supabase
        .from('snippets')
        .update({ 
          url: urlData.publicUrl,
          status: 'created'
        })
        .eq('id', clip.id);
      
      console.log(`Clip ${clip.id} processed and uploaded successfully`);
      
      // Cleanup temp files
      try {
        await Deno.remove(tempMediaPath);
        await Deno.remove(outputPath);
      } catch (e) {
        console.warn('Temp file cleanup warning:', e);
      }
      
    } catch (error) {
      console.error('Error processing clip', clip.id, ':', error);
      // Continue with next clip
    }
  }
  
  console.log('Background video processing complete');
}
