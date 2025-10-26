import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/HeroBanner";
import { AnimeSection } from "@/components/AnimeSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Eye, Sparkles } from "lucide-react";
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
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm hover-lift">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trending Titles</p>
                <p className="text-2xl font-bold">{trendingAnime?.length || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm hover-lift">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/20">
                <Eye className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Watched</p>
                <p className="text-2xl font-bold">{mostWatchedAnime?.length || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm hover-lift">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Releases</p>
                <p className="text-2xl font-bold">{latestSeries?.length || 0}</p>
              </div>
            </div>
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

        {/* CTA Section */}
        <Card className="p-12 border-border/50 bg-gradient-primary backdrop-blur-sm text-center animate-fade-in">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Watching?</h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of anime fans and discover your next favorite series
          </p>
          <Link to="/browse">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
              Browse All Anime
            </Button>
          </Link>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
