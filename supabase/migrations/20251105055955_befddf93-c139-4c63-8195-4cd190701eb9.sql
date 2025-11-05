-- Drop trigger first, then functions
DROP TRIGGER IF EXISTS anime_slug_trigger ON anime;
DROP FUNCTION IF EXISTS set_anime_slug();
DROP FUNCTION IF EXISTS generate_slug(TEXT);

-- Recreate generate_slug with proper search_path
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- Recreate set_anime_slug with proper search_path
CREATE OR REPLACE FUNCTION set_anime_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER anime_slug_trigger
BEFORE INSERT OR UPDATE ON anime
FOR EACH ROW
EXECUTE FUNCTION set_anime_slug();