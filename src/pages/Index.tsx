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
        .order("view_count", { ascending: false })
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0f0f0f] via-[#0c0c0c] to-black">
        <Loader2 className="h-10 w-10 animate-spin text-purple-400 drop-shadow-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0a0a0a] via-[#0b0b0b] to-black text-gray-100 relative overflow-hidden">
      {/* Glow background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-40 left-1/3 w-96 h-96 bg-purple-700/20 blur-[180px] rounded-full"></div>
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-indigo-700/20 blur-[160px] rounded-full"></div>
      </div>

      <Navbar />

      {/* Banner */}
      <div className="relative z-10">
        <BannerCarousel />
      </div>

      <main className="relative z-20 container mx-auto px-4 py-10 space-y-16">
        {trendingAnime?.length > 0 && (
          <section className="animate-fade-in-up">
            <AnimeSection
              title="🔥 Trending Now"
              animes={trendingAnime}
              viewAllLink="/browse"
              layout="scroll"
            />
          </section>
        )}

        {mostWatchedAnime?.length > 0 && (
          <section className="animate-fade-in-up delay-100">
            <AnimeSection
              title="👁️ Most Watched"
              animes={mostWatchedAnime}
              viewAllLink="/browse"
              layout="scroll"
            />
          </section>
        )}

        {latestSeries?.length > 0 && (
          <section className="animate-fade-in-up delay-200">
            <AnimeSection
              title="📺 Latest Series"
              animes={latestSeries}
              viewAllLink="/browse"
              layout="scroll"
            />
          </section>
        )}

        {latestMovies?.length > 0 && (
          <section className="animate-fade-in-up delay-300">
            <AnimeSection
              title="🎬 Latest Movies"
              animes={latestMovies}
              viewAllLink="/movies"
              layout="scroll"
            />
          </section>
        )}

        {top10Anime?.length > 0 && (
          <section className="animate-fade-in-up delay-400">
            <AnimeSection
              title="⭐ Top 10"
              animes={top10Anime}
              viewAllLink="/browse"
              layout="grid"
            />
          </section>
        )}

        {upcomingAnime?.length > 0 && (
          <section className="animate-fade-in-up delay-500">
            <AnimeSection
              title="📅 Upcoming"
              animes={upcomingAnime}
              viewAllLink="/schedule"
              layout="scroll"
            />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
