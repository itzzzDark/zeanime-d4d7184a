-- Add schedule management table
CREATE TABLE IF NOT EXISTS public.anime_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  time_slot TIME NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on anime_schedule
ALTER TABLE public.anime_schedule ENABLE ROW LEVEL SECURITY;

-- Policies for anime_schedule
CREATE POLICY "Anyone can view schedules"
  ON public.anime_schedule FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage schedules"
  ON public.anime_schedule FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_anime_schedule_day ON public.anime_schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_anime_schedule_anime_id ON public.anime_schedule(anime_id);
CREATE INDEX IF NOT EXISTS idx_comments_anime_id ON public.comments(anime_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_anime ON public.favorites(user_id, anime_id);

-- Add comment likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes"
  ON public.comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like comments"
  ON public.comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their likes"
  ON public.comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Add admin comment management policies
CREATE POLICY "Admins can delete any comment"
  ON public.comments FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add share tracking table
CREATE TABLE IF NOT EXISTS public.anime_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.anime_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can share anime"
  ON public.anime_shares FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view share stats"
  ON public.anime_shares FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on anime_schedule
CREATE TRIGGER update_anime_schedule_updated_at
  BEFORE UPDATE ON public.anime_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();