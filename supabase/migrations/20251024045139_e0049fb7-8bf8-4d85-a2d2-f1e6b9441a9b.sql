-- Create enum for anime type
CREATE TYPE anime_type AS ENUM ('series', 'movie', 'ova', 'special');

-- Create enum for anime status
CREATE TYPE anime_status AS ENUM ('ongoing', 'completed', 'upcoming');

-- Create anime table
CREATE TABLE anime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_english TEXT,
  title_japanese TEXT,
  description TEXT,
  cover_image TEXT,
  banner_image TEXT,
  type anime_type NOT NULL DEFAULT 'series',
  status anime_status NOT NULL DEFAULT 'ongoing',
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_episodes INTEGER DEFAULT 0,
  genres TEXT[] DEFAULT '{}',
  release_year INTEGER,
  studio TEXT,
  is_trending BOOLEAN DEFAULT false,
  is_most_watched BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  schedule_day TEXT,
  schedule_time TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create episodes table
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE NOT NULL,
  episode_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(anime_id, episode_number)
);

-- Create indexes for better performance
CREATE INDEX idx_anime_type ON anime(type);
CREATE INDEX idx_anime_status ON anime(status);
CREATE INDEX idx_anime_trending ON anime(is_trending);
CREATE INDEX idx_anime_most_watched ON anime(is_most_watched);
CREATE INDEX idx_anime_genres ON anime USING GIN(genres);
CREATE INDEX idx_episodes_anime_id ON episodes(anime_id);

-- Enable Row Level Security
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access to anime" 
  ON anime FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to episodes" 
  ON episodes FOR SELECT 
  USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anime_updated_at 
  BEFORE UPDATE ON anime 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at 
  BEFORE UPDATE ON episodes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();