import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { AnimeSection } from "@/components/AnimeSection";
import { Loader2 } from "lucide-react";

const Index = () => {
  // Fetch trending anime
  const { data: trendingAnime, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("is_trending", true)
        .order("view_count", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch most watched anime
  const { data: mostWatchedAnime, isLoading: mostWatchedLoading } = useQuery({
    queryKey: ["most-watched-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("is_most_watched", true)
        .order("view_count", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch latest series
  const { data: latestSeries, isLoading: latestSeriesLoading } = useQuery({
    queryKey: ["latest-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("type", "series")
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch latest movies
  const { data: latestMovies, isLoading: latestMoviesLoading } = useQuery({
    queryKey: ["latest-movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("type", "movie")
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
  });

  // Get featured anime for hero banner
  const featuredAnime = trendingAnime?.[0];

  const isLoading = trendingLoading || mostWatchedLoading || latestSeriesLoading || latestMoviesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {featuredAnime && (
        <HeroBanner
          title={featuredAnime.title}
          description={featuredAnime.description || ""}
          bannerImage={featuredAnime.banner_image || featuredAnime.cover_image || "/placeholder.svg"}
          animeId={featuredAnime.id}
        />
      )}

      <div className="container px-4 py-8 space-y-12">
        <AnimeSection
          title="🔥 Trending Now"
          animes={trendingAnime || []}
          viewAllLink="/trending"
        />

        <AnimeSection
          title="👁️ Most Watched"
          animes={mostWatchedAnime || []}
          viewAllLink="/most-watched"
        />

        <AnimeSection
          title="📺 Latest Series"
          animes={latestSeries || []}
          viewAllLink="/series"
        />

        <AnimeSection
          title="🎬 Latest Movies"
          animes={latestMovies || []}
          viewAllLink="/movies"
        />
      </div>
    </div>
  );
};

export default Index;
