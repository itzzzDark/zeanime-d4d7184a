-- Create embed_servers table for managing video servers
CREATE TABLE public.embed_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.embed_servers ENABLE ROW LEVEL SECURITY;

-- Policies for embed_servers
CREATE POLICY "Anyone can view active servers"
ON public.embed_servers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage servers"
ON public.embed_servers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update episodes table to support multiple servers
ALTER TABLE public.episodes 
DROP COLUMN IF EXISTS filemoon_url,
DROP COLUMN IF EXISTS abyss_url,
DROP COLUMN IF EXISTS player4me_url;

-- Add server_urls jsonb column to store multiple server URLs
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS server_urls JSONB DEFAULT '{}';

-- Add trigger for embed_servers updated_at
CREATE TRIGGER update_embed_servers_updated_at
BEFORE UPDATE ON public.embed_servers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();