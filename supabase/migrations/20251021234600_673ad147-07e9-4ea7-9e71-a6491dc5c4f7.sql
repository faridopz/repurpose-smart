-- Add platform and persona fields to ai_content table
ALTER TABLE ai_content 
ADD COLUMN IF NOT EXISTS platform text,
ADD COLUMN IF NOT EXISTS tone text DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS persona text,
ADD COLUMN IF NOT EXISTS prompt_used text,
ADD COLUMN IF NOT EXISTS model text DEFAULT 'gpt-4',
ADD COLUMN IF NOT EXISTS regenerated_count integer DEFAULT 0;

-- Create snippets table for video clips
CREATE TABLE IF NOT EXISTS snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  start_time numeric NOT NULL,
  end_time numeric NOT NULL,
  url text,
  thumbnail_url text,
  tags text[],
  reason text,
  transcript_chunk text,
  status text DEFAULT 'suggested',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on snippets
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

-- RLS policies for snippets
CREATE POLICY "Users can view own snippets"
  ON snippets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snippets"
  ON snippets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snippets"
  ON snippets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snippets"
  ON snippets FOR DELETE
  USING (auth.uid() = user_id);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- RLS policies for collections
CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- Create collection_snippets junction table
CREATE TABLE IF NOT EXISTS collection_snippets (
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  snippet_id uuid NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  added_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (collection_id, snippet_id)
);

-- Enable RLS on collection_snippets
ALTER TABLE collection_snippets ENABLE ROW LEVEL SECURITY;

-- RLS policies for collection_snippets
CREATE POLICY "Users can view own collection snippets"
  ON collection_snippets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_snippets.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own collection snippets"
  ON collection_snippets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_snippets.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own collection snippets"
  ON collection_snippets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_snippets.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- Add enrichment fields to transcripts table
ALTER TABLE transcripts
ADD COLUMN IF NOT EXISTS keywords text[],
ADD COLUMN IF NOT EXISTS sentiment_timeline jsonb,
ADD COLUMN IF NOT EXISTS quotes text[];

-- Add tone preference to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_tone_default text DEFAULT 'professional';