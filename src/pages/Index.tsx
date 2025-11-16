import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BannerCarousel } from "@/components/BannerCarousel";
import { AnimeSection } from "@/components/AnimeSection";
import { 
  Loader2, 
  Calendar, 
  Clock, 
  Star, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Heart,
  Swords,
  Castle,
  Laugh,
  Film,
  Clock4
} from "lucide-react";

const Index = () => {
  // ---- Queries ----
  const { data: trendingAnime = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["trending-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("is_trending", true)
        .order("view_count", { ascending: false })
        .limit(12);
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
        .limit(12);
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
        .limit(12);
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
        .limit(12);
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
        .limit(12);
      if (error) throw error;
      return data || [];
    },
  });

  // New Categories
  const { data: romanceAnime = [], isLoading: romanceLoading } = useQuery({
    queryKey: ["romance-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .contains("genres", ["Romance"])
        .order("rating", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: actionAnime = [], isLoading: actionLoading } = useQuery({
    queryKey: ["action-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .contains("genres", ["Action"])
        .order("view_count", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: fantasyAnime = [], isLoading: fantasyLoading } = useQuery({
    queryKey: ["fantasy-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .contains("genres", ["Fantasy"])
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: comedyAnime = [], isLoading: comedyLoading } = useQuery({
    queryKey: ["comedy-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .contains("genres", ["Comedy"])
        .order("rating", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: thisWeekAnime = [], isLoading: thisWeekLoading } = useQuery({
    queryKey: ["this-week-anime"],
    queryFn: async () => {
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
      const endOfWeek = new Date(currentDate.setDate(currentDate.getDate() + 6));
      
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("status", "upcoming")
        .gte('release_date', startOfWeek.toISOString())
        .lte('release_date', endOfWeek.toISOString())
        .order("release_date", { ascending: true })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading =
    trendingLoading || mostWatchedLoading || latestSeriesLoading ||
    latestMoviesLoading || top10Loading || upcomingLoading ||
    romanceLoading || actionLoading || fantasyLoading || comedyLoading || thisWeekLoading;

  // Section styling configurations
  const sectionStyles = {
    trending: {
      gradient: "bg-gradient-to-r from-rose-500/10 to-rose-600/5",
      icon: <TrendingUp className="h-4 w-4" />,
      textColor: "text-rose-400",
      layout: "scroll" as const
    },
    mostWatched: {
      gradient: "bg-gradient-to-r from-amber-500/10 to-amber-600/5",
      icon: <Users className="h-4 w-4" />,
      textColor: "text-amber-400",
      layout: "scroll" as const
    },
    newSeries: {
      gradient: "bg-gradient-to-r from-violet-500/10 to-violet-600/5",
      icon: <Sparkles className="h-4 w-4" />,
      textColor: "text-violet-400",
      layout: "grid" as const
    },
    top10: {
      gradient: "bg-gradient-to-r from-blue-500/10 to-blue-600/5",
      icon: <Star className="h-4 w-4" />,
      textColor: "text-blue-400",
      layout: "grid" as const
    },
    movies: {
      gradient: "bg-gradient-to-r from-emerald-500/10 to-emerald-600/5",
      icon: <Film className="h-4 w-4" />,
      textColor: "text-emerald-400",
      layout: "scroll" as const
    },
    comingSoon: {
      gradient: "bg-gradient-to-r from-indigo-500/10 to-indigo-600/5",
      icon: <Calendar className="h-4 w-4" />,
      textColor: "text-indigo-400",
      layout: "scroll" as const
    },
    romance: {
      gradient: "bg-gradient-to-r from-pink-500/10 to-pink-600/5",
      icon: <Heart className="h-4 w-4" />,
      textColor: "text-pink-400",
      layout: "grid" as const
    },
    action: {
      gradient: "bg-gradient-to-r from-red-500/10 to-red-600/5",
      icon: <Swords className="h-4 w-4" />,
      textColor: "text-red-400",
      layout: "grid" as const
    },
    fantasy: {
      gradient: "bg-gradient-to-r from-purple-500/10 to-purple-600/5",
      icon: <Castle className="h-4 w-4" />,
      textColor: "text-purple-400",
      layout: "grid" as const
    },
    comedy: {
      gradient: "bg-gradient-to-r from-yellow-500/10 to-yellow-600/5",
      icon: <Laugh className="h-4 w-4" />,
      textColor: "text-yellow-400",
      layout: "grid" as const
    },
    thisWeek: {
      gradient: "bg-gradient-to-r from-cyan-500/10 to-cyan-600/5",
      icon: <Clock4 className="h-4 w-4" />,
      textColor: "text-cyan-400",
      layout: "scroll" as const
    }
  };

  // Enhanced title component
  const SectionTitle = ({ title, style }: { title: string; style: any }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm">
        {style.icon}
      </div>
      <h2 className={`text-lg font-semibold uppercase tracking-wider ${style.textColor}`}>
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
    </div>
  );

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-sm font-light uppercase tracking-wider">Loading Content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-gray-100 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a]">
      <Navbar />

      {/* Banner */}
      <section className="relative z-10">
        <BannerCarousel />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
      </section>

      {/* Main Sections */}
      <main className="relative z-20 container mx-auto px-4 py-8 space-y-8">
        {/* Trending */}
        {trendingAnime.length > 0 && (
          <section className={`rounded-lg p-4 ${sectionStyles.trending.gradient}`}>
            <SectionTitle title="Trending Now" style={sectionStyles.trending} />
            <AnimeSection
              title=""
              animes={trendingAnime}
              viewAllLink="/trending"
              layout="scroll"
              cardGap="gap-2"
            />
          </section>
        )}

        {/* This Week */}
        {thisWeekAnime.length > 0 && (
          <section className={`rounded-lg p-4 ${sectionStyles.thisWeek.gradient}`}>
            <SectionTitle title="This Week" style={sectionStyles.thisWeek} />
            <AnimeSection
              title=""
              animes={thisWeekAnime}
              viewAllLink="/schedule"
              layout="scroll"
              cardGap="gap-2"
            />
          </section>
        )}

        {/* Most Watched */}
        {mostWatchedAnime.length > 0 && (
          <section className={`rounded-lg p-4 ${sectionStyles.mostWatched.gradient}`}>
            <SectionTitle title="Most Watched" style={sectionStyles.mostWatched} />
            <AnimeSection
              title=""
              animes={mostWatchedAnime}
              viewAllLink="/most-watched"
              layout="scroll"
              cardGap="gap-2"
            />
          </section>
        )}

        {/* Top 10 */}
        {top10Anime.length > 0 && (
          <section className={`rounded-lg p-4 ${sectionStyles.top10.gradient}`}>
            <SectionTitle title="Top Rated" style={sectionStyles.top10} />
            <AnimeSection
              title=""
              animes={top10Anime}
              viewAllLink="/top"
              layout="grid"
              cardGap="gap-2"
            />
          </section>
        )}

        {/* Genre Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Romance */}
          {romanceAnime.length > 0 && (
            <section className={`rounded-lg p-4 ${sectionStyles.romance.gradient}`}>
              <SectionTitle title="Romance" style={sectionStyles.romance} />
              <AnimeSection
                title=""
                animes={romanceAnime}
                viewAllLink="/genre/romance"
                layout="grid"
                cardGap="gap-2"
              />
            </section>
          )}

          {/* Action */}
          {actionAnime.length > 0 && (
            <section className={`rounded-lg p-4 ${sectionStyles.action.gradient}`}>
              <SectionTitle title="Action" style={sectionStyles.action} />
              <AnimeSection
                title=""
                animes={actionAnime}
                viewAllLink="/genre/action"
                layout="grid"
                cardGap="gap-2"
              />
            </section>
          )}

          {/* Fantasy */}
          {fantasyAnime.length > 0 && (
            <section className={`rounded-lg p-4 ${sectionStyles.fantasy.gradient}`}>
              <SectionTitle title="Fantasy" style={sectionStyles.fantasy} />
              <AnimeSection
                title=""
                animes={fantasyAnime}
                viewAllLink="/genre/fantasy"
                layout="grid"
                cardGap="gap-2"
              />
            </section>
          )}

          {/* Comedy */}
          {comedyAnime.length > 0 && (
            <section className={`rounded-lg p-4 ${sectionStyles.comedy.gradient}`}>
              <SectionTitle title="Comedy" style={sectionStyles.comedy} />
              <AnimeSection
                title=""
                animes={comedyAnime}
                viewAllLink="/genre/comedy"
                layout="grid"
                cardGap="gap-2"
              />
            </section>
          )}
        </div>

        {/* New Series */}
        {latestSeries.length > 0 && (
          <section className={`rounded-lg p-4 ${sectionStyles.newSeries.gradient}`}>
            <SectionTitle title="New Series" style={sectionStyles.newSeries} />
            <AnimeSection
              title=""
              animes={latestSeries}
              viewAllLink="/series"
              layout="grid"
              cardGap="gap-2"
            />
          </section>
        )}

        {/* Movies */}
        {latestMovies.length > 0 && (
          <section className={`rounded-lg p-4 ${sectionStyles.movies.gradient}`}>
            <SectionTitle title="Latest Movies" style={sectionStyles.movies} />
            <AnimeSection
              title=""
              animes={latestMovies}
              viewAllLink="/movies"
              layout="scroll"
              cardGap="gap-2"
            />
          </section>
        )}

        {/* Coming Soon */}
        {upcomingAnime.length > 0 && (
          <section className={`rounded-lg p-4 ${sectionStyles.comingSoon.gradient}`}>
            <SectionTitle title="Coming Soon" style={sectionStyles.comingSoon} />
            <AnimeSection
              title=""
              animes={upcomingAnime}
              viewAllLink="/upcoming"
              layout="scroll"
              cardGap="gap-2"
            />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
