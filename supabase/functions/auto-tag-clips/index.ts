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
    const { snippetIds } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Auto-tagging clips:', snippetIds);

    // Get snippets
    const { data: snippets, error: snippetError } = await supabase
      .from('snippets')
      .select('*')
      .in('id', snippetIds);

    if (snippetError || !snippets) {
      throw new Error('Failed to fetch snippets');
    }

    // Process each snippet
    for (const snippet of snippets) {
      const prompt = `Analyze this video clip transcript and generate tags:

Transcript: ${snippet.transcript_chunk || 'No transcript available'}

Generate tags in these categories:
1. Themes (e.g., "Leadership", "Innovation", "Sales Strategy")
2. Emotions (e.g., "Inspiring", "Urgent", "Educational")
3. Topics (e.g., "Product Demo", "Customer Success", "Market Trends")

Return ONLY valid JSON:
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Limit to 5 most relevant tags.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an expert content analyst. Always return valid JSON.' },
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        console.error('AI tagging failed for snippet:', snippet.id);
        continue;
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      // Update snippet with tags
      await supabase
        .from('snippets')
        .update({ tags: result.tags })
        .eq('id', snippet.id);

      console.log('Tagged snippet:', snippet.id, 'with tags:', result.tags);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Clips tagged successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto-tag error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
