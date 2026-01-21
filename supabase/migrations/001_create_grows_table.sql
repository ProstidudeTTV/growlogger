-- Create grows table
CREATE TABLE IF NOT EXISTS grows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  flower_start_date DATE,
  harvest_date DATE,
  strain TEXT,
  germination_method TEXT,
  pot_size TEXT,
  current_stage TEXT,
  is_harvested BOOLEAN DEFAULT FALSE,
  wet_weight NUMERIC,
  dry_weight NUMERIC,
  harvest_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on discord_user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_grows_discord_user_id ON grows(discord_user_id);

-- Create index on is_harvested for filtering ongoing grows
CREATE INDEX IF NOT EXISTS idx_grows_is_harvested ON grows(is_harvested);

-- Create index on start_date for timer calculations
CREATE INDEX IF NOT EXISTS idx_grows_start_date ON grows(start_date);

-- Enable Row Level Security
ALTER TABLE grows ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own grows
CREATE POLICY "Users can view their own grows"
  ON grows FOR SELECT
  USING (discord_user_id = current_setting('app.discord_user_id', true));

-- Create RLS policy: Users can insert their own grows
CREATE POLICY "Users can insert their own grows"
  ON grows FOR INSERT
  WITH CHECK (discord_user_id = current_setting('app.discord_user_id', true));

-- Create RLS policy: Users can update their own grows
CREATE POLICY "Users can update their own grows"
  ON grows FOR UPDATE
  USING (discord_user_id = current_setting('app.discord_user_id', true));

-- Create RLS policy: Users can delete their own grows
CREATE POLICY "Users can delete their own grows"
  ON grows FOR DELETE
  USING (discord_user_id = current_setting('app.discord_user_id', true));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_grows_updated_at
  BEFORE UPDATE ON grows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
