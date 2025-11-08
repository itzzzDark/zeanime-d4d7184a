-- Change episodes table to use anime_slug instead of anime_id
ALTER TABLE public.episodes ADD COLUMN anime_slug TEXT;

-- Populate anime_slug from existing anime_id
UPDATE public.episodes e
SET anime_slug = a.slug
FROM public.anime a
WHERE e.anime_id = a.id;

-- Make anime_slug NOT NULL after populating
ALTER TABLE public.episodes ALTER COLUMN anime_slug SET NOT NULL;

-- Drop old anime_id column
ALTER TABLE public.episodes DROP COLUMN anime_id;

-- Add index for better performance
CREATE INDEX idx_episodes_anime_slug ON public.episodes(anime_slug);

-- Update RLS policies to use slug
DROP POLICY IF EXISTS "Admins can delete episodes" ON public.episodes;
DROP POLICY IF EXISTS "Admins can insert episodes" ON public.episodes;
DROP POLICY IF EXISTS "Admins can update episodes" ON public.episodes;
DROP POLICY IF EXISTS "Allow public read access to episodes" ON public.episodes;

CREATE POLICY "Allow public read access to episodes"
  ON public.episodes FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert episodes"
  ON public.episodes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update episodes"
  ON public.episodes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete episodes"
  ON public.episodes FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));