-- Add season support to episodes table
ALTER TABLE public.episodes 
ADD COLUMN season_number integer DEFAULT 1 NOT NULL;