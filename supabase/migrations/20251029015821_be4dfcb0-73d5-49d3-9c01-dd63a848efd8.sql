-- Add profile customization fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_image text,
ADD COLUMN IF NOT EXISTS custom_theme jsonb DEFAULT '{"primary": "purple", "style": "cyberpunk"}',
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS favorite_genres text[] DEFAULT '{}';

-- Add watch preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS watch_preferences jsonb DEFAULT '{"autoplay": true, "quality": "1080p", "subtitles": true}';

-- Update episodes table to ensure duration is tracked
-- Duration column already exists, no changes needed

-- Add view tracking for anime
CREATE TABLE IF NOT EXISTS public.anime_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id uuid REFERENCES public.anime(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  view_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.anime_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can track views"
ON public.anime_views
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own view history"
ON public.anime_views
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add continue watching support to watch_history
ALTER TABLE public.watch_history
ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_watch_history_user_last_watched ON public.watch_history(user_id, last_watched DESC);
CREATE INDEX IF NOT EXISTS idx_anime_trending ON public.anime(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_anime_most_watched ON public.anime(is_most_watched) WHERE is_most_watched = true;