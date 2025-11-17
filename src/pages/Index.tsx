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
  Clock4,
  ChevronRight
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

  // Section styling configurations with descriptions
  const sectionStyles = {
    trending: {
      icon: <TrendingUp className="h-4 w-4" />,
      textColor: "text-rose-400",
      description: "Most popular anime trending right now"
    },
    mostWatched: {
      icon: <Users className="h-4 w-4" />,
      textColor: "text-amber-400",
      description: "Highest view count anime of all time"
    },
    newSeries: {
      icon: <Sparkles className="h-4 w-4" />,
      textColor: "text-violet-400",
      description: "Latest anime series just added"
    },
    top10: {
      icon: <Star className="h-4 w-4" />,
      textColor: "text-blue-400",
      description: "Top rated anime by community"
    },
    movies: {
      icon: <Film className="h-4 w-4" />,
      textColor: "text-emerald-400",
      description: "Newest anime movie releases"
    },
    comingSoon: {
      icon: <Calendar className="h-4 w-4" />,
      textColor: "text-indigo-400",
      description: "Upcoming anime to watch out for"
    },
    romance: {
      icon: <Heart className="h-4 w-4" />,
      textColor: "text-pink-400",
      description: "Heartwarming love stories and relationships"
    },
    action: {
      icon: <Swords className="h-4 w-4" />,
      textColor: "text-red-400",
      description: "High-octane battles and adventures"
    },
    fantasy: {
      icon: <Castle className="h-4 w-4" />,
      textColor: "text-purple-400",
      description: "Magical worlds and epic quests"
    },
    comedy: {
      icon: <Laugh className="h-4 w-4" />,
      textColor: "text-yellow-400",
      description: "Hilarious moments and funny stories"
    },
    thisWeek: {
      icon: <Clock4 className="h-4 w-4" />,
      textColor: "text-cyan-400",
      description: "New episodes releasing this week"
    }
  };

  // Skeleton loading components
  const ScrollSkeleton = () => (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex-shrink-0 w-48">
          <Skeleton className="w-full h-64 rounded-lg bg-white/10" />
          <Skeleton className="w-3/4 h-4 mt-2 bg-white/10" />
          <Skeleton className="w-1/2 h-3 mt-1 bg-white/10" />
        </div>
      ))}
    </div>
  );

  const GridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index}>
          <Skeleton className="w-full h-48 rounded-lg bg-white/10" />
          <Skeleton className="w-3/4 h-4 mt-2 bg-white/10" />
          <Skeleton className="w-1/2 h-3 mt-1 bg-white/10" />
        </div>
      ))}
    </div>
  );

  // ---- Loading State ----
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 space-y-12">
          {/* Banner Skeleton */}
          <Skeleton className="w-full h-80 rounded-lg bg-white/10" />
          
          {/* Trending Skeleton */}
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg bg-white/10" />
                  <Skeleton className="w-32 h-6 bg-white/10" />
                </div>
                <Skeleton className="w-20 h-6 bg-white/10 rounded" />
              </div>
              <Skeleton className="w-48 h-4 ml-11 bg-white/10" />
            </div>
            <ScrollSkeleton />
          </div>

          {/* This Week Skeleton */}
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg bg-white/10" />
                  <Skeleton className="w-32 h-6 bg-white/10" />
                </div>
                <Skeleton className="w-20 h-6 bg-white/10 rounded" />
              </div>
              <Skeleton className="w-48 h-4 ml-11 bg-white/10" />
            </div>
            <ScrollSkeleton />
          </div>

          {/* Genre Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg bg-white/10" />
                      <Skeleton className="w-24 h-6 bg-white/10" />
                    </div>
                    <Skeleton className="w-20 h-6 bg-white/10 rounded" />
                  </div>
                  <Skeleton className="w-48 h-4 ml-11 bg-white/10" />
                </div>
                <GridSkeleton />
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
      <main className="relative z-20 container mx-auto px-4 py-8 space-y-12">
        {/* Trending */}
        {trendingAnime.length > 0 && (
          <AnimeSection
            title="Trending Now"
            animes={trendingAnime}
            viewAllLink="/trending"
            layout="scroll"
            cardGap="gap-4"
            icon={sectionStyles.trending.icon}
            textColor={sectionStyles.trending.textColor}
            description={sectionStyles.trending.description}
          />
        )}

        {/* This Week */}
        {thisWeekAnime.length > 0 && (
          <AnimeSection
            title="This Week"
            animes={thisWeekAnime}
            viewAllLink="/schedule"
            layout="scroll"
            cardGap="gap-4"
            icon={sectionStyles.thisWeek.icon}
            textColor={sectionStyles.thisWeek.textColor}
            description={sectionStyles.thisWeek.description}
          />
        )}

        {/* Most Watched */}
        {mostWatchedAnime.length > 0 && (
          <AnimeSection
            title="Most Watched"
            animes={mostWatchedAnime}
            viewAllLink="/most-watched"
            layout="scroll"
            cardGap="gap-4"
            icon={sectionStyles.mostWatched.icon}
            textColor={sectionStyles.mostWatched.textColor}
            description={sectionStyles.mostWatched.description}
          />
        )}

        {/* Top 10 */}
        {top10Anime.length > 0 && (
          <AnimeSection
            title="Top Rated"
            animes={top10Anime}
            viewAllLink="/top"
            layout="scroll"
            cardGap="gap-4"
            icon={sectionStyles.top10.icon}
            textColor={sectionStyles.top10.textColor}
            description={sectionStyles.top10.description}
          />
        )}

        {/* Genre Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Romance */}
          {romanceAnime.length > 0 && (
            <AnimeSection
              title="Romance"
              animes={romanceAnime}
              viewAllLink="/genre/romance"
              layout="scroll"
              cardGap="gap-4"
              icon={sectionStyles.romance.icon}
              textColor={sectionStyles.romance.textColor}
              description={sectionStyles.romance.description}
            />
          )}

          {/* Action */}
          {actionAnime.length > 0 && (
            <AnimeSection
              title="Action"
              animes={actionAnime}
              viewAllLink="/genre/action"
              layout="scroll"
              cardGap="gap-4"
              icon={sectionStyles.action.icon}
              textColor={sectionStyles.action.textColor}
              description={sectionStyles.action.description}
            />
          )}

          {/* Fantasy */}
          {fantasyAnime.length > 0 && (
            <AnimeSection
              title="Fantasy"
              animes={fantasyAnime}
              viewAllLink="/genre/fantasy"
              layout="scroll"
              cardGap="gap-4"
              icon={sectionStyles.fantasy.icon}
              textColor={sectionStyles.fantasy.textColor}
              description={sectionStyles.fantasy.description}
            />
          )}

          {/* Comedy */}
          {comedyAnime.length > 0 && (
            <AnimeSection
              title="Comedy"
              animes={comedyAnime}
              viewAllLink="/genre/comedy"
              layout="scroll"
              cardGap="gap-4"
              icon={sectionStyles.comedy.icon}
              textColor={sectionStyles.comedy.textColor}
              description={sectionStyles.comedy.description}
            />
          )}
        </div>

        {/* New Series */}
        {latestSeries.length > 0 && (
          <AnimeSection
            title="New Series"
            animes={latestSeries}
            viewAllLink="/series"
            layout="scroll"
            cardGap="gap-4"
            icon={sectionStyles.newSeries.icon}
            textColor={sectionStyles.newSeries.textColor}
            description={sectionStyles.newSeries.description}
          />
        )}

        {/* Movies */}
        {latestMovies.length > 0 && (
          <AnimeSection
            title="Latest Movies"
            animes={latestMovies}
            viewAllLink="/movies"
            layout="scroll"
            cardGap="gap-4"
            icon={sectionStyles.movies.icon}
            textColor={sectionStyles.movies.textColor}
            description={sectionStyles.movies.description}
          />
        )}

        {/* Coming Soon */}
        {upcomingAnime.length > 0 && (
          <AnimeSection
            title="Coming Soon"
            animes={upcomingAnime}
            viewAllLink="/upcoming"
            layout="scroll"
            cardGap="gap-4"
            icon={sectionStyles.comingSoon.icon}
            textColor={sectionStyles.comingSoon.textColor}
            description={sectionStyles.comingSoon.description}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
