import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BannerCarousel } from "@/components/BannerCarousel";
import { AnimeSection } from "@/components/AnimeSection";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Loader2, 
  Calendar, 
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
      icon: <TrendingUp className="h-4 w-4" />,
      textColor: "text-rose-400",
    },
    mostWatched: {
      icon: <Users className="h-4 w-4" />,
      textColor: "text-amber-400",
    },
    newSeries: {
      icon: <Sparkles className="h-4 w-4" />,
      textColor: "text-violet-400",
    },
    top10: {
      icon: <Star className="h-4 w-4" />,
      textColor: "text-blue-400",
    },
    movies: {
      icon: <Film className="h-4 w-4" />,
      textColor: "text-emerald-400",
    },
    comingSoon: {
      icon: <Calendar className="h-4 w-4" />,
      textColor: "text-indigo-400",
    },
    romance: {
      icon: <Heart className="h-4 w-4" />,
      textColor: "text-pink-400",
    },
    action: {
      icon: <Swords className="h-4 w-4" />,
      textColor: "text-red-400",
    },
    fantasy: {
      icon: <Castle className="h-4 w-4" />,
      textColor: "text-purple-400",
    },
    comedy: {
      icon: <Laugh className="h-4 w-4" />,
      textColor: "text-yellow-400",
    },
    thisWeek: {
      icon: <Clock4 className="h-4 w-4" />,
      textColor: "text-cyan-400",
    }
  };

  // Updated title component - centered with icon above text, no View All
  const SectionHeader = ({ title, style }: { title: string; style: any }) => (
    <div className="flex flex-col items-center justify-center mb-6">
      <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 mb-2">
        {style.icon}
      </div>
      <h2 className={`text-xl font-bold uppercase tracking-wider ${style.textColor}`}>
        {title}
      </h2>
    </div>
  );

  // Skeleton loading components
  const ScrollSkeleton = () => (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex-shrink-0 w-48">
          <Skeleton className="w-full h-64 rounded-lg bg-white/10" />
          <Skeleton className="w-3/4 h-4 mt-2 bg-white/10" />
          <Skeleton className="w-1/2 h-3 mt-1 bg-white/10" />
        </div>
      ))}
    </div>
  );

  const SectionHeaderSkeleton = () => (
    <div className="flex flex-col items-center justify-center mb-6">
      <Skeleton className="w-8 h-8 rounded-lg bg-white/10 mb-2" />
      <Skeleton className="w-32 h-6 bg-white/10" />
    </div>
  );

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Banner Skeleton */}
          <Skeleton className="w-full h-80 rounded-lg bg-white/10" />
          
          {/* Trending Skeleton */}
          <div>
            <SectionHeaderSkeleton />
            <ScrollSkeleton />
          </div>

          {/* This Week Skeleton */}
          <div>
            <SectionHeaderSkeleton />
            <ScrollSkeleton />
          </div>

          {/* Genre Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <SectionHeaderSkeleton />
                <ScrollSkeleton />
              </div>
            ))}
          </div>
        </div>
        <Footer />
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
          <section>
            <SectionHeader 
              title="Trending Now" 
              style={sectionStyles.trending} 
            />
            <AnimeSection
              title=""
              animes={trendingAnime}
              viewAllLink="/trending"
              layout="scroll"
              cardGap="gap-3"
              hideHeader={true}
            />
          </section>
        )}

        {/* This Week */}
        {thisWeekAnime.length > 0 && (
          <section>
            <SectionHeader 
              title="This Week" 
              style={sectionStyles.thisWeek} 
            />
            <AnimeSection
              title=""
              animes={thisWeekAnime}
              viewAllLink="/schedule"
              layout="scroll"
              cardGap="gap-3"
              hideHeader={true}
            />
          </section>
        )}

        {/* Most Watched */}
        {mostWatchedAnime.length > 0 && (
          <section>
            <SectionHeader 
              title="Most Watched" 
              style={sectionStyles.mostWatched} 
            />
            <AnimeSection
              title=""
              animes={mostWatchedAnime}
              viewAllLink="/most-watched"
              layout="scroll"
              cardGap="gap-3"
              hideHeader={true}
            />
          </section>
        )}

        {/* Top 10 */}
        {top10Anime.length > 0 && (
          <section>
            <SectionHeader 
              title="Top Rated" 
              style={sectionStyles.top10} 
            />
            <AnimeSection
              title=""
              animes={top10Anime}
              viewAllLink="/top"
              layout="scroll"
              cardGap="gap-3"
              hideHeader={true}
            />
          </section>
        )}

        {/* Genre Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Romance */}
          {romanceAnime.length > 0 && (
            <section>
              <SectionHeader 
                title="Romance" 
                style={sectionStyles.romance} 
              />
              <AnimeSection
                title=""
                animes={romanceAnime}
                viewAllLink="/genre/romance"
                layout="scroll"
                cardGap="gap-3"
                hideHeader={true}
              />
            </section>
          )}

          {/* Action */}
          {actionAnime.length > 0 && (
            <section>
              <SectionHeader 
                title="Action" 
                style={sectionStyles.action} 
              />
              <AnimeSection
                title=""
                animes={actionAnime}
                viewAllLink="/genre/action"
                layout="scroll"
                cardGap="gap-3"
                hideHeader={true}
              />
            </section>
          )}

          {/* Fantasy */}
          {fantasyAnime.length > 0 && (
            <section>
              <SectionHeader 
                title="Fantasy" 
                style={sectionStyles.fantasy} 
              />
              <AnimeSection
                title=""
                animes={fantasyAnime}
                viewAllLink="/genre/fantasy"
                layout="scroll"
                cardGap="gap-3"
                hideHeader={true}
              />
            </section>
          )}

          {/* Comedy */}
          {comedyAnime.length > 0 && (
            <section>
              <SectionHeader 
                title="Comedy" 
                style={sectionStyles.comedy} 
              />
              <AnimeSection
                title=""
                animes={comedyAnime}
                viewAllLink="/genre/comedy"
                layout="scroll"
                cardGap="gap-3"
                hideHeader={true}
              />
            </section>
          )}
        </div>

        {/* New Series */}
        {latestSeries.length > 0 && (
          <section>
            <SectionHeader 
              title="New Series" 
              style={sectionStyles.newSeries} 
            />
            <AnimeSection
              title=""
              animes={latestSeries}
              viewAllLink="/series"
              layout="scroll"
              cardGap="gap-3"
              hideHeader={true}
            />
          </section>
        )}

        {/* Movies */}
        {latestMovies.length > 0 && (
          <section>
            <SectionHeader 
              title="Latest Movies" 
              style={sectionStyles.movies} 
            />
            <AnimeSection
              title=""
              animes={latestMovies}
              viewAllLink="/movies"
              layout="scroll"
              cardGap="gap-3"
              hideHeader={true}
            />
          </section>
        )}

        {/* Coming Soon */}
        {upcomingAnime.length > 0 && (
          <section>
            <SectionHeader 
              title="Coming Soon" 
              style={sectionStyles.comingSoon} 
            />
            <AnimeSection
              title=""
              animes={upcomingAnime}
              viewAllLink="/upcoming"
              layout="scroll"
              cardGap="gap-3"
              hideHeader={true}
            />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
