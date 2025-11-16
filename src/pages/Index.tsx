import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BannerCarousel } from "@/components/BannerCarousel";
import { AnimeSection } from "@/components/AnimeSection";
import { Loader2, Calendar, Clock, Star, TrendingUp, Users, Sparkles } from "lucide-react";

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
        .limit(10);
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
        .limit(10);
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
        .limit(10);
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
        .limit(10);
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

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0c0c0f] via-[#0a0a0d] to-black">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-violet-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)] mx-auto mb-4" />
          <p className="text-violet-200 text-lg font-light animate-pulse">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  // Section styling configurations
  const sectionStyles = {
    trending: {
      gradient: "from-rose-600/20 via-pink-600/15 to-transparent",
      glow: "from-rose-500/20",
      icon: <TrendingUp className="h-5 w-5" />,
      textGradient: "bg-gradient-to-r from-rose-400 to-pink-400"
    },
    mostWatched: {
      gradient: "from-amber-600/20 via-orange-600/15 to-transparent",
      glow: "from-amber-500/20",
      icon: <Users className="h-5 w-5" />,
      textGradient: "bg-gradient-to-r from-amber-400 to-orange-400"
    },
    newSeries: {
      gradient: "from-violet-600/20 via-purple-600/15 to-transparent",
      glow: "from-violet-500/20",
      icon: <Sparkles className="h-5 w-5" />,
      textGradient: "bg-gradient-to-r from-violet-400 to-purple-400"
    },
    top10: {
      gradient: "from-blue-600/20 via-cyan-600/15 to-transparent",
      glow: "from-blue-500/20",
      icon: <Star className="h-5 w-5" />,
      textGradient: "bg-gradient-to-r from-blue-400 to-cyan-400"
    },
    movies: {
      gradient: "from-emerald-600/20 via-teal-600/15 to-transparent",
      glow: "from-emerald-500/20",
      icon: <Clock className="h-5 w-5" />,
      textGradient: "bg-gradient-to-r from-emerald-400 to-teal-400"
    },
    comingSoon: {
      gradient: "from-indigo-600/20 via-blue-600/15 to-transparent",
      glow: "from-indigo-500/20",
      icon: <Calendar className="h-5 w-5" />,
      textGradient: "bg-gradient-to-r from-indigo-400 to-blue-400"
    },
    romance: {
      gradient: "from-pink-600/20 via-rose-600/15 to-transparent",
      glow: "from-pink-500/20",
      icon: "❤️",
      textGradient: "bg-gradient-to-r from-pink-400 to-rose-400"
    },
    action: {
      gradient: "from-red-600/20 via-orange-600/15 to-transparent",
      glow: "from-red-500/20",
      icon: "⚡",
      textGradient: "bg-gradient-to-r from-red-400 to-orange-400"
    },
    fantasy: {
      gradient: "from-purple-600/20 via-violet-600/15 to-transparent",
      glow: "from-purple-500/20",
      icon: "🔮",
      textGradient: "bg-gradient-to-r from-purple-400 to-violet-400"
    },
    comedy: {
      gradient: "from-yellow-600/20 via-amber-600/15 to-transparent",
      glow: "from-yellow-500/20",
      icon: "😂",
      textGradient: "bg-gradient-to-r from-yellow-400 to-amber-400"
    },
    thisWeek: {
      gradient: "from-cyan-600/20 via-sky-600/15 to-transparent",
      glow: "from-cyan-500/20",
      icon: "📅",
      textGradient: "bg-gradient-to-r from-cyan-400 to-sky-400"
    }
  };

  // Enhanced title component
  const SectionTitle = ({ title, style, icon }: { title: string; style: any; icon: any }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 rounded-lg bg-gradient-to-br ${style.gradient} border border-white/10 backdrop-blur-sm`}>
        {typeof icon === 'string' ? (
          <span className="text-lg">{icon}</span>
        ) : (
          icon
        )}
      </div>
      <h2 className={`text-3xl font-bold bg-clip-text text-transparent ${style.textGradient} drop-shadow-lg`}>
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent ml-4" />
    </div>
  );

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-gray-100 bg-gradient-to-br from-[#050505] via-[#090910] to-[#0a0a1a]">
      {/* Enhanced Ambient glow layers */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-24 left-1/4 w-[40rem] h-[40rem] bg-violet-700/25 blur-[200px] rounded-full animate-pulse" />
        <div className="absolute bottom-10 right-1/3 w-[35rem] h-[35rem] bg-indigo-600/30 blur-[220px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[70rem] h-[70rem] bg-purple-900/15 blur-[250px] rounded-full" />
        <div className="absolute top-3/4 left-1/3 w-[30rem] h-[30rem] bg-rose-600/20 blur-[180px] rounded-full animate-pulse delay-1000" />
      </div>

      {/* Enhanced Overlay gradient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.15),transparent_70%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />

      <Navbar />

      {/* Banner */}
      <section className="relative z-10">
        <BannerCarousel />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </section>

      {/* Main Sections */}
      <main className="relative z-20 container mx-auto px-4 py-12 space-y-24">
        {/* Trending */}
        {trendingAnime.length > 0 && (
          <section className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.trending.gradient} rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />
            <div className="relative">
              <SectionTitle title="🔥 Trending Now" style={sectionStyles.trending} icon={sectionStyles.trending.icon} />
              <AnimeSection
                title=""
                animes={trendingAnime}
                viewAllLink="/trending"
                layout="scroll"
              />
            </div>
          </section>
        )}

        {/* This Week */}
        {thisWeekAnime.length > 0 && (
          <section className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.thisWeek.gradient} rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />
            <div className="relative">
              <SectionTitle title="📅 Coming This Week" style={sectionStyles.thisWeek} icon={sectionStyles.thisWeek.icon} />
              <AnimeSection
                title=""
                animes={thisWeekAnime}
                viewAllLink="/schedule"
                layout="scroll"
                showCountdown={true}
              />
            </div>
          </section>
        )}

        {/* Most Watched */}
        {mostWatchedAnime.length > 0 && (
          <section className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.mostWatched.gradient} rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />
            <div className="relative">
              <SectionTitle title="👑 Most Watched" style={sectionStyles.mostWatched} icon={sectionStyles.mostWatched.icon} />
              <AnimeSection
                title=""
                animes={mostWatchedAnime}
                viewAllLink="/most-watched"
                layout="scroll"
              />
            </div>
          </section>
        )}

        {/* Top 10 */}
        {top10Anime.length > 0 && (
          <section className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.top10.gradient} rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />
            <div className="relative">
              <SectionTitle title="⭐ Top 10 Anime" style={sectionStyles.top10} icon={sectionStyles.top10.icon} />
              <AnimeSection
                title=""
                animes={top10Anime}
                viewAllLink="/top"
                layout="grid"
                showRanking={true}
              />
            </div>
          </section>
        )}

        {/* New Series */}
        {latestSeries.length > 0 && (
          <section className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.newSeries.gradient} rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />
            <div className="relative">
              <SectionTitle title="✨ New Series" style={sectionStyles.newSeries} icon={sectionStyles.newSeries.icon} />
              <AnimeSection
                title=""
                animes={latestSeries}
                viewAllLink="/series"
                layout="scroll"
              />
            </div>
          </section>
        )}

        {/* Genre Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Romance */}
          {romanceAnime.length > 0 && (
            <section className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.romance.gradient} rounded-2xl blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500`} />
              <div className="relative">
                <SectionTitle title="💖 Romance" style={sectionStyles.romance} icon={sectionStyles.romance.icon} />
                <AnimeSection
                  title=""
                  animes={romanceAnime}
                  viewAllLink="/genre/romance"
                  layout="compact"
                />
              </div>
            </section>
          )}

          {/* Action */}
          {actionAnime.length > 0 && (
            <section className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.action.gradient} rounded-2xl blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500`} />
              <div className="relative">
                <SectionTitle title="⚡ Action" style={sectionStyles.action} icon={sectionStyles.action.icon} />
                <AnimeSection
                  title=""
                  animes={actionAnime}
                  viewAllLink="/genre/action"
                  layout="compact"
                />
              </div>
            </section>
          )}

          {/* Fantasy */}
          {fantasyAnime.length > 0 && (
            <section className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.fantasy.gradient} rounded-2xl blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500`} />
              <div className="relative">
                <SectionTitle title="🔮 Fantasy" style={sectionStyles.fantasy} icon={sectionStyles.fantasy.icon} />
                <AnimeSection
                  title=""
                  animes={fantasyAnime}
                  viewAllLink="/genre/fantasy"
                  layout="compact"
                />
              </div>
            </section>
          )}

          {/* Comedy */}
          {comedyAnime.length > 0 && (
            <section className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.comedy.gradient} rounded-2xl blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500`} />
              <div className="relative">
                <SectionTitle title="😂 Comedy" style={sectionStyles.comedy} icon={sectionStyles.comedy.icon} />
                <AnimeSection
                  title=""
                  animes={comedyAnime}
                  viewAllLink="/genre/comedy"
                  layout="compact"
                />
              </div>
            </section>
          )}
        </div>

        {/* Movies */}
        {latestMovies.length > 0 && (
          <section className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.movies.gradient} rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />
            <div className="relative">
              <SectionTitle title="🎬 Latest Movies" style={sectionStyles.movies} icon={sectionStyles.movies.icon} />
              <AnimeSection
                title=""
                animes={latestMovies}
                viewAllLink="/movies"
                layout="scroll"
              />
            </div>
          </section>
        )}

        {/* Coming Soon */}
        {upcomingAnime.length > 0 && (
          <section className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${sectionStyles.comingSoon.gradient} rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />
            <div className="relative">
              <SectionTitle title="⏳ Coming Soon" style={sectionStyles.comingSoon} icon={sectionStyles.comingSoon.icon} />
              <AnimeSection
                title=""
                animes={upcomingAnime}
                viewAllLink="/upcoming"
                layout="scroll"
                showCountdown={true}
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
