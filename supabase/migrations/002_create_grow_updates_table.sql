-- Create grow_updates table for daily logs
CREATE TABLE IF NOT EXISTS grow_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grow_id UUID NOT NULL REFERENCES grows(id) ON DELETE CASCADE,
  update_date DATE NOT NULL,
  pictures TEXT[] DEFAULT '{}',
  environment TEXT,
  feeding TEXT,
  growth_stage TEXT,
  plant_health TEXT,
  notes TEXT,
  terpene_smell TEXT,
  flower_development TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on grow_id for faster queries
CREATE INDEX IF NOT EXISTS idx_grow_updates_grow_id ON grow_updates(grow_id);

-- Create index on update_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_grow_updates_update_date ON grow_updates(update_date);

-- Create composite index for grow_id and update_date
CREATE INDEX IF NOT EXISTS idx_grow_updates_grow_date ON grow_updates(grow_id, update_date);

-- Enable Row Level Security
ALTER TABLE grow_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can view updates for their own grows
CREATE POLICY "Users can view updates for their own grows"
  ON grow_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM grows
      WHERE grows.id = grow_updates.grow_id
      AND grows.discord_user_id = current_setting('app.discord_user_id', true)
    )
  );

-- Create RLS policy: Users can insert updates for their own grows
CREATE POLICY "Users can insert updates for their own grows"
  ON grow_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grows
      WHERE grows.id = grow_updates.grow_id
      AND grows.discord_user_id = current_setting('app.discord_user_id', true)
    )
  );

-- Create RLS policy: Users can update updates for their own grows
CREATE POLICY "Users can update updates for their own grows"
  ON grow_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM grows
      WHERE grows.id = grow_updates.grow_id
      AND grows.discord_user_id = current_setting('app.discord_user_id', true)
    )
  );

-- Create RLS policy: Users can delete updates for their own grows
CREATE POLICY "Users can delete updates for their own grows"
  ON grow_updates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM grows
      WHERE grows.id = grow_updates.grow_id
      AND grows.discord_user_id = current_setting('app.discord_user_id', true)
    )
  );

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_grow_updates_updated_at
  BEFORE UPDATE ON grow_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
