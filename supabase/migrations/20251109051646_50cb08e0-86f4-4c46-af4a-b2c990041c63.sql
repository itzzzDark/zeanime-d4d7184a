-- Add foreign key from episodes.anime_slug to anime.slug
ALTER TABLE episodes
ADD CONSTRAINT episodes_anime_slug_fkey
FOREIGN KEY (anime_slug) REFERENCES anime(slug) ON DELETE CASCADE;

-- Add unique constraint to watchlist to prevent duplicates
-- First remove any existing duplicates
DELETE FROM watchlist a USING watchlist b
WHERE a.id < b.id AND a.user_id = b.user_id AND a.anime_id = b.anime_id;

-- Add unique constraint
ALTER TABLE watchlist
ADD CONSTRAINT watchlist_user_anime_unique UNIQUE (user_id, anime_id);