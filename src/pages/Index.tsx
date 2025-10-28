import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/HeroBanner";
import { AnimeSection } from "@/components/AnimeSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Eye, Sparkles, Play, Calendar, Users, Film } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen flex flex-col">
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
        {/* Featured Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
          <Card className="overflow-hidden border-border/50 hover-lift group cursor-pointer">
            <Link to="/browse">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Play className="h-12 w-12 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-2xl font-bold text-white">Browse Anime</h3>
                    <p className="text-white/80">Discover thousands of titles</p>
                  </div>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="overflow-hidden border-border/50 hover-lift group cursor-pointer">
            <Link to="/schedule">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Calendar className="h-12 w-12 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-2xl font-bold text-white">Release Schedule</h3>
                    <p className="text-white/80">Never miss an episode</p>
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        </div>

        <div className="animate-slide-up">
          <AnimeSection
            title="🔥 Trending Now"
            animes={trendingAnime || []}
            viewAllLink="/browse"
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <AnimeSection
            title="👁️ Most Watched"
            animes={mostWatchedAnime || []}
            viewAllLink="/browse"
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <AnimeSection
            title="📺 Latest Series"
            animes={latestSeries || []}
            viewAllLink="/browse"
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <AnimeSection
            title="🎬 Latest Movies"
            animes={latestMovies || []}
            viewAllLink="/movies"
          />
        </div>

        {/* Community Section */}
        <Card className="p-8 md:p-12 border-border/50 bg-gradient-card backdrop-blur-sm text-center animate-fade-in overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative">
            <Users className="h-16 w-16 mx-auto mb-6 text-primary animate-glow" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Community</h2>
            <p className="text-lg mb-6 text-muted-foreground max-w-2xl mx-auto">
              Connect with thousands of anime fans, share your favorites, and discover your next obsession
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/browse">
                <Button size="lg" className="gap-2 bg-gradient-primary hover:opacity-90">
                  <Play className="h-5 w-5" />
                  Start Watching
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2">
                  <Sparkles className="h-5 w-5" />
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
