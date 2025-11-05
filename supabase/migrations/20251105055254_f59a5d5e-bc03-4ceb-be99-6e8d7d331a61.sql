-- Add slug column to anime table
ALTER TABLE anime ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS anime_slug_unique ON anime(slug);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special characters
  slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing anime with slugs
UPDATE anime SET slug = generate_slug(title) WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE anime ALTER COLUMN slug SET NOT NULL;

-- Trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION set_anime_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER anime_slug_trigger
BEFORE INSERT OR UPDATE ON anime
FOR EACH ROW
EXECUTE FUNCTION set_anime_slug();