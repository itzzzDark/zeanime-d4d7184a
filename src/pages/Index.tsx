import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BannerCarousel } from "@/components/BannerCarousel";
import { AnimeSection } from "@/components/AnimeSection";
import { Loader2 } from "lucide-react";

const Index = () => {
  // ---- Supabase Queries ----
  const fetchAnime = async (filters: any) => {
    const { data, error } = await supabase.from("anime").select("*").match(filters);
    if (error) throw error;
    return data;
  };

  const { data: trendingAnime, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending-anime"],
    queryFn: async () =>
      (await supabase
        .from("anime")
        .select("*")
        .eq("is_trending", true)
        .order("view_count", { ascending: false })
        .limit(10)).data,
  });

  const { data: mostWatchedAnime, isLoading: mostWatchedLoading } = useQuery({
    queryKey: ["most-watched-anime"],
    queryFn: async () =>
      (await supabase
        .from("anime")
        .select("*")
        .eq("is_most_watched", true)
        .order("view_count", { ascending: false })
        .limit(10)).data,
  });

  const { data: latestSeries, isLoading: latestSeriesLoading } = useQuery({
    queryKey: ["latest-series"],
    queryFn: async () =>
      (await supabase
        .from("anime")
        .select("*")
        .eq("type", "series")
        .eq("status", "ongoing")
        .order("created_at", { ascending: false })
        .limit(10)).data,
  });

  const { data: latestMovies, isLoading: latestMoviesLoading } = useQuery({
    queryKey: ["latest-movies"],
    queryFn: async () =>
      (await supabase
        .from("anime")
        .select("*")
        .eq("type", "movie")
        .order("created_at", { ascending: false })
        .limit(10)).data,
  });

  const { data: top10Anime, isLoading: top10Loading } = useQuery({
    queryKey: ["top10-anime"],
    queryFn: async () =>
      (await supabase
        .from("anime")
        .select("*")
        .order("rating", { ascending: false })
        .limit(10)).data,
  });

  const { data: upcomingAnime, isLoading: upcomingLoading } = useQuery({
    queryKey: ["upcoming-anime"],
    queryFn: async () =>
      (await supabase
        .from("anime")
        .select("*")
        .eq("status", "upcoming")
        .order("release_year", { ascending: false })
        .limit(10)).data,
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0c0c0f] via-[#0a0a0d] to-black">
        <Loader2 className="h-10 w-10 animate-spin text-violet-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-gray-100 bg-gradient-to-b from-[#060606] via-[#0b0b0f] to-black">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-32 left-1/4 w-[36rem] h-[36rem] bg-violet-700/20 blur-[220px] rounded-full"></div>
        <div className="absolute bottom-10 right-1/3 w-[30rem] h-[30rem] bg-indigo-600/20 blur-[200px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] bg-purple-900/10 blur-[260px] rounded-full"></div>
      </div>

      {/* Floating glass gradient layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.04),transparent_80%)] pointer-events-none" />

      <Navbar />

      {/* Banner Carousel */}
      <section className="relative z-10 shadow-2xl">
        <BannerCarousel />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </section>

      <main className="relative z-20 container mx-auto px-4 py-12 space-y-20 backdrop-blur-[2px]">
        {/* Each section uses subtle staggered fade-in motion */}
        {trendingAnime?.length > 0 && (
          <section className="animate-fade-in-up">
            <AnimeSection
              title="🔥 Trending Now"
              subtitle="What’s hot this week"
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
              subtitle="Fan-favorite hits everyone’s watching"
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
              subtitle="Ongoing series updated weekly"
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
              subtitle="Fresh cinematic adventures"
              animes={latestMovies}
              viewAllLink="/movies"
              layout="scroll"
            />
          </section>
        )}

        {top10Anime?.length > 0 && (
          <section className="animate-fade-in-up delay-400">
            <AnimeSection
              title="⭐ Top 10 Anime"
              subtitle="Critically acclaimed and top-rated gems"
              animes={top10Anime}
              viewAllLink="/top"
              layout="grid"
            />
          </section>
        )}

        {upcomingAnime?.length > 0 && (
          <section className="animate-fade-in-up delay-500">
            <AnimeSection
              title="📅 Upcoming Releases"
              subtitle="Mark your calendars — new anime are coming!"
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
