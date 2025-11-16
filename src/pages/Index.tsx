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
  Clock4,
  Crown,
  Zap
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
      gradient: "from-rose-500/10 to-rose-600/5",
      border: "border-rose-500/20",
      icon: <TrendingUp className="h-4 w-4" />,
      textColor: "text-rose-400",
      layout: "featured-scroll" as const
    },
    mostWatched: {
      gradient: "from-amber-500/10 to-amber-600/5",
      border: "border-amber-500/20",
      icon: <Users className="h-4 w-4" />,
      textColor: "text-amber-400",
      layout: "scroll" as const
    },
    newSeries: {
      gradient: "from-violet-500/10 to-violet-600/5",
      border: "border-violet-500/20",
      icon: <Sparkles className="h-4 w-4" />,
      textColor: "text-violet-400",
      layout: "grid" as const
    },
    top10: {
      gradient: "from-blue-500/10 to-blue-600/5",
      border: "border-blue-500/20",
      icon: <Star className="h-4 w-4" />,
      textColor: "text-blue-400",
      layout: "numbered-grid" as const
    },
    movies: {
      gradient: "from-emerald-500/10 to-emerald-600/5",
      border: "border-emerald-500/20",
      icon: <Film className="h-4 w-4" />,
      textColor: "text-emerald-400",
      layout: "poster-scroll" as const
    },
    comingSoon: {
      gradient: "from-indigo-500/10 to-indigo-600/5",
      border: "border-indigo-500/20",
      icon: <Calendar className="h-4 w-4" />,
      textColor: "text-indigo-400",
      layout: "compact" as const
    },
    romance: {
      gradient: "from-pink-500/10 to-pink-600/5",
      border: "border-pink-500/20",
      icon: <Heart className="h-4 w-4" />,
      textColor: "text-pink-400",
      layout: "compact-grid" as const
    },
    action: {
      gradient: "from-red-500/10 to-red-600/5",
      border: "border-red-500/20",
      icon: <Swords className="h-4 w-4" />,
      textColor: "text-red-400",
      layout: "compact-grid" as const
    },
    fantasy: {
      gradient: "from-purple-500/10 to-purple-600/5",
      border: "border-purple-500/20",
      icon: <Castle className="h-4 w-4" />,
      textColor: "text-purple-400",
      layout: "compact-grid" as const
    },
    comedy: {
      gradient: "from-yellow-500/10 to-yellow-600/5",
      border: "border-yellow-500/20",
      icon: <Laugh className="h-4 w-4" />,
      textColor: "text-yellow-400",
      layout: "compact-grid" as const
    },
    thisWeek: {
      gradient: "from-cyan-500/10 to-cyan-600/5",
      border: "border-cyan-500/20",
      icon: <Clock4 className="h-4 w-4" />,
      textColor: "text-cyan-400",
      layout: "schedule" as const
    }
  };

  // Enhanced title component
  const SectionTitle = ({ title, style }: { title: string; style: any }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 rounded-lg bg-white/5 border ${style.border} backdrop-blur-sm`}>
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
      {/* Subtle Ambient glow layers */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-24 left-1/4 w-[40rem] h-[40rem] bg-gray-800/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 right-1/3 w-[35rem] h-[35rem] bg-gray-700/10 blur-[100px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] bg-gray-900/5 blur-[150px] rounded-full" />
      </div>

      {/* Soft Overlay gradient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />

      <Navbar />

      {/* Banner */}
      <section className="relative z-10">
        <BannerCarousel />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
      </section>

      {/* Main Sections */}
      <main className="relative z-20 container mx-auto px-4 py-12 space-y-16">
        {/* Trending - Featured Scroll */}
        {trendingAnime.length > 0 && (
          <section className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.trending.gradient} rounded-xl border ${sectionStyles.trending.border} backdrop-blur-sm`} />
            <div className="relative p-6">
              <SectionTitle title="Trending Now" style={sectionStyles.trending} />
              <AnimeSection
                title=""
                animes={trendingAnime}
                viewAllLink="/trending"
                layout="featured-scroll"
              />
            </div>
          </section>
        )}

        {/* This Week - Schedule Layout */}
        {thisWeekAnime.length > 0 && (
          <section className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.thisWeek.gradient} rounded-xl border ${sectionStyles.thisWeek.border} backdrop-blur-sm`} />
            <div className="relative p-6">
              <SectionTitle title="This Week" style={sectionStyles.thisWeek} />
              <AnimeSection
                title=""
                animes={thisWeekAnime}
                viewAllLink="/schedule"
                layout="schedule"
              />
            </div>
          </section>
        )}

        {/* Most Watched - Standard Scroll */}
        {mostWatchedAnime.length > 0 && (
          <section className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.mostWatched.gradient} rounded-xl border ${sectionStyles.mostWatched.border} backdrop-blur-sm`} />
            <div className="relative p-6">
              <SectionTitle title="Most Watched" style={sectionStyles.mostWatched} />
              <AnimeSection
                title=""
                animes={mostWatchedAnime}
                viewAllLink="/most-watched"
                layout="scroll"
              />
            </div>
          </section>
        )}

        {/* Top 10 - Numbered Grid */}
        {top10Anime.length > 0 && (
          <section className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.top10.gradient} rounded-xl border ${sectionStyles.top10.border} backdrop-blur-sm`} />
            <div className="relative p-6">
              <SectionTitle title="Top Rated" style={sectionStyles.top10} />
              <AnimeSection
                title=""
                animes={top10Anime}
                viewAllLink="/top"
                layout="numbered-grid"
              />
            </div>
          </section>
        )}

        {/* Genre Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Romance - Compact Grid */}
          {romanceAnime.length > 0 && (
            <section className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.romance.gradient} rounded-xl border ${sectionStyles.romance.border} backdrop-blur-sm`} />
              <div className="relative p-6">
                <SectionTitle title="Romance" style={sectionStyles.romance} />
                <AnimeSection
                  title=""
                  animes={romanceAnime}
                  viewAllLink="/genre/romance"
                  layout="compact-grid"
                />
              </div>
            </section>
          )}

          {/* Action - Compact Grid */}
          {actionAnime.length > 0 && (
            <section className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.action.gradient} rounded-xl border ${sectionStyles.action.border} backdrop-blur-sm`} />
              <div className="relative p-6">
                <SectionTitle title="Action" style={sectionStyles.action} />
                <AnimeSection
                  title=""
                  animes={actionAnime}
                  viewAllLink="/genre/action"
                  layout="compact-grid"
                />
              </div>
            </section>
          )}

          {/* Fantasy - Compact Grid */}
          {fantasyAnime.length > 0 && (
            <section className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.fantasy.gradient} rounded-xl border ${sectionStyles.fantasy.border} backdrop-blur-sm`} />
              <div className="relative p-6">
                <SectionTitle title="Fantasy" style={sectionStyles.fantasy} />
                <AnimeSection
                  title=""
                  animes={fantasyAnime}
                  viewAllLink="/genre/fantasy"
                  layout="compact-grid"
                />
              </div>
            </section>
          )}

          {/* Comedy - Compact Grid */}
          {comedyAnime.length > 0 && (
            <section className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.comedy.gradient} rounded-xl border ${sectionStyles.comedy.border} backdrop-blur-sm`} />
              <div className="relative p-6">
                <SectionTitle title="Comedy" style={sectionStyles.comedy} />
                <AnimeSection
                  title=""
                  animes={comedyAnime}
                  viewAllLink="/genre/comedy"
                  layout="compact-grid"
                />
              </div>
            </section>
          )}
        </div>

        {/* New Series - Grid Layout */}
        {latestSeries.length > 0 && (
          <section className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.newSeries.gradient} rounded-xl border ${sectionStyles.newSeries.border} backdrop-blur-sm`} />
            <div className="relative p-6">
              <SectionTitle title="New Series" style={sectionStyles.newSeries} />
              <AnimeSection
                title=""
                animes={latestSeries}
                viewAllLink="/series"
                layout="grid"
              />
            </div>
          </section>
        )}

        {/* Movies - Poster Scroll */}
        {latestMovies.length > 0 && (
          <section className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.movies.gradient} rounded-xl border ${sectionStyles.movies.border} backdrop-blur-sm`} />
            <div className="relative p-6">
              <SectionTitle title="Latest Movies" style={sectionStyles.movies} />
              <AnimeSection
                title=""
                animes={latestMovies}
                viewAllLink="/movies"
                layout="poster-scroll"
              />
            </div>
          </section>
        )}

        {/* Coming Soon - Compact Layout */}
        {upcomingAnime.length > 0 && (
          <section className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.comingSoon.gradient} rounded-xl border ${sectionStyles.comingSoon.border} backdrop-blur-sm`} />
            <div className="relative p-6">
              <SectionTitle title="Coming Soon" style={sectionStyles.comingSoon} />
              <AnimeSection
                title=""
                animes={upcomingAnime}
                viewAllLink="/upcoming"
                layout="compact"
              />
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
