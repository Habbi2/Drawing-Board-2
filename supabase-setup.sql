 -- Drawing Board Supabase Setup
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Create the drawings table
CREATE TABLE IF NOT EXISTS drawings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  canvas_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_drawings_updated_at ON drawings(updated_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;

-- 4. Create a policy to allow all operations (public access)
-- Note: For production, you may want to add authentication
CREATE POLICY "Allow all operations" ON drawings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Create a function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_drawings_updated_at ON drawings;
CREATE TRIGGER update_drawings_updated_at
  BEFORE UPDATE ON drawings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create the storage bucket for images (run in Storage section or via API)
-- Go to Storage > New Bucket > Name: "images" > Public: ON

-- IMPORTANT: After creating the bucket, set up the storage policy:
-- Go to Storage > images > Policies > New Policy
-- Use this policy for public access:

-- For SELECT (viewing images):
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');

-- For INSERT (uploading images):
-- CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
