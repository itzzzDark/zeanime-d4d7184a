import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BannerCarousel } from "@/components/BannerCarousel";
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
        .limit(10);
      
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
        .order("view_count", { ascending: false})
        .limit(10);
      
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
        .eq("status", "ongoing")
        .order("created_at", { ascending: false })
        .limit(10);
      
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
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch top 10 (by rating)
  const { data: top10Anime, isLoading: top10Loading } = useQuery({
    queryKey: ["top10-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .order("rating", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch upcoming (scheduled for future)
  const { data: upcomingAnime, isLoading: upcomingLoading } = useQuery({
    queryKey: ["upcoming-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("status", "upcoming")
        .order("release_year", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const isLoading = 
    trendingLoading || 
    mostWatchedLoading || 
    latestSeriesLoading || 
    latestMoviesLoading || 
    top10Loading || 
    upcomingLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Banner Carousel */}
      <BannerCarousel />

      <div className="container px-4 py-8 space-y-12">
        {/* Trending Now */}
        {trendingAnime && trendingAnime.length > 0 && (
          <div className="animate-fade-in">
            <AnimeSection
              title="🔥 Trending Now"
              animes={trendingAnime}
              viewAllLink="/browse"
              layout="scroll"
            />
          </div>
        )}

        {/* Most Watched */}
        {mostWatchedAnime && mostWatchedAnime.length > 0 && (
          <div className="animate-slide-up">
            <AnimeSection
              title="👁️ Most Watched"
              animes={mostWatchedAnime}
              viewAllLink="/browse"
              layout="scroll"
            />
          </div>
        )}

        {/* Latest Series */}
        {latestSeries && latestSeries.length > 0 && (
          <div className="animate-fade-in">
            <AnimeSection
              title="📺 Latest Series"
              animes={latestSeries}
              viewAllLink="/browse"
              layout="scroll"
            />
          </div>
        )}

        {/* Latest Movies */}
        {latestMovies && latestMovies.length > 0 && (
          <div className="animate-slide-up">
            <AnimeSection
              title="🎬 Latest Movies"
              animes={latestMovies}
              viewAllLink="/movies"
              layout="scroll"
            />
          </div>
        )}

        {/* Top 10 */}
        {top10Anime && top10Anime.length > 0 && (
          <div className="animate-fade-in">
            <AnimeSection
              title="⭐ Top 10"
              animes={top10Anime}
              viewAllLink="/browse"
              layout="grid"
            />
          </div>
        )}

        {/* Upcoming */}
        {upcomingAnime && upcomingAnime.length > 0 && (
          <div className="animate-slide-up">
            <AnimeSection
              title="📅 Upcoming"
              animes={upcomingAnime}
              viewAllLink="/schedule"
              layout="scroll"
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Index;
