import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BannerCarousel } from "@/components/BannerCarousel";
import { AnimeSection } from "@/components/AnimeSection";
import { Loader2 } from "lucide-react";

const Index = () => {
  // ---- Fetch Helper ----
  const fetchAnime = async (filters: Record<string, any>) => {
    const { data, error } = await supabase.from("anime").select("*").match(filters);
    if (error) throw new Error(error.message);
    return data || [];
  };

  // ---- Queries ----
  const { data: trendingAnime = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["trending-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("is_trending", true)
        .order("view_count", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: mostWatchedAnime = [], isLoading: mostWatchedLoading } = useQuery({
    queryKey: ["most-watched-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("is_most_watched", true)
        .order("view_count", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: latestSeries = [], isLoading: latestSeriesLoading } = useQuery({
    queryKey: ["latest-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("type", "series")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: latestMovies = [], isLoading: latestMoviesLoading } = useQuery({
    queryKey: ["latest-movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("type", "movie")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: top10Anime = [], isLoading: top10Loading } = useQuery({
    queryKey: ["top10-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .order("rating", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: upcomingAnime = [], isLoading: upcomingLoading } = useQuery({
    queryKey: ["upcoming-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("status", "upcoming")
        .order("release_year", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading =
    trendingLoading ||
    mostWatchedLoading ||
    latestSeriesLoading ||
    latestMoviesLoading ||
    top10Loading ||
    upcomingLoading;

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0c0c0f] via-[#0a0a0d] to-black">
        <Loader2 className="h-10 w-10 animate-spin text-violet-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
      </div>
    );
  }

  // ---- UI ----
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-gray-100 bg-gradient-to-b from-[#050505] via-[#090910] to-black">
      {/* Ambient glow layers */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-24 left-1/4 w-[36rem] h-[36rem] bg-violet-700/20 blur-[200px] rounded-full" />
        <div className="absolute bottom-10 right-1/3 w-[30rem] h-[30rem] bg-indigo-600/25 blur-[220px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] bg-purple-900/10 blur-[250px] rounded-full" />
      </div>

      {/* Overlay gradient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none" />

      <Navbar />

      {/* Banner */}
      <section className="relative z-10">
        <BannerCarousel />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </section>

      {/* Main Sections */}
      <main className="relative z-20 container mx-auto px-4 py-12 space-y-24">
  {/* Trending */}
  {trendingAnime.length > 0 && (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-700/10 to-transparent rounded-xl blur-2xl" />
      <AnimeSection
        title="🔥 Trending Now"
        animes={trendingAnime}
        viewAllLink="/browse"
        layout="scroll"
      />
    </section>
  )}

  {/* Most Watched */}
  {mostWatchedAnime.length > 0 && (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-to-l from-indigo-700/10 to-transparent rounded-xl blur-2xl" />
      <AnimeSection
        title="👑 Most Watched"
        animes={mostWatchedAnime}
        viewAllLink="/browse"
        layout="scroll"
      />
    </section>
  )}

  {/* Romance */}
  {latestSeries.length > 0 && (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent rounded-xl blur-2xl" />
      <AnimeSection
        title="🔮 New Series"
        animes={latestSeries}
        viewAllLink="/romance"
        layout="scroll"
      />
    </section>
  )}

  {/* Fantasy */}
  {top10Anime.length > 0 && (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-to-l from-blue-700/15 to-transparent rounded-xl blur-2xl" />
      <AnimeSection
        title="🌌 Top 10 Animes"
        animes={top10Anime}
        viewAllLink="/fantasy"
        layout="grid"
      />
    </section>
  )}

  {/* Movies */}
  {latestMovies.length > 0 && (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-transparent rounded-xl blur-2xl" />
      <AnimeSection
        title="🎬 Latest Movies"
        animes={latestMovies}
        viewAllLink="/movies"
        layout="scroll"
      />
    </section>
  )}

  {/* Coming Soon */}
  {upcomingAnime.length > 0 && (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-transparent rounded-xl blur-2xl" />
      <AnimeSection
        title="⏳ Coming Soon"
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
