import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star, Calendar, TrendingUp } from "lucide-react";
import { Loader2 } from "lucide-react";

const AnimeDetail = () => {
  const { id } = useParams();

  // Fetch anime details
  const { data: anime, isLoading: animeLoading } = useQuery({
    queryKey: ["anime", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch episodes
  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ["episodes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("anime_id", id)
        .order("episode_number", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (animeLoading || episodesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Anime not found</h1>
          <Link to="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Banner Section */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={anime.banner_image || anime.cover_image || "/placeholder.svg"} 
            alt={anime.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>

      {/* Content Section */}
      <div className="container px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image */}
          <div className="flex-shrink-0">
            <img 
              src={anime.cover_image || "/placeholder.svg"} 
              alt={anime.title}
              className="w-64 rounded-xl shadow-card border border-border/50"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                {anime.title}
              </h1>
              {anime.title_english && (
                <p className="text-lg text-muted-foreground">{anime.title_english}</p>
              )}
              {anime.title_japanese && (
                <p className="text-sm text-muted-foreground">{anime.title_japanese}</p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary text-primary-foreground">
                {anime.type}
              </Badge>
              <Badge className="bg-secondary text-secondary-foreground">
                {anime.status}
              </Badge>
              {anime.rating > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {anime.rating.toFixed(1)}
                </Badge>
              )}
              {anime.is_trending && (
                <Badge variant="outline" className="gap-1 border-primary text-primary">
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </Badge>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {anime.release_year && (
                <div>
                  <p className="text-muted-foreground">Release Year</p>
                  <p className="font-semibold">{anime.release_year}</p>
                </div>
              )}
              {anime.total_episodes > 0 && (
                <div>
                  <p className="text-muted-foreground">Episodes</p>
                  <p className="font-semibold">{anime.total_episodes}</p>
                </div>
              )}
              {anime.studio && (
                <div>
                  <p className="text-muted-foreground">Studio</p>
                  <p className="font-semibold">{anime.studio}</p>
                </div>
              )}
              {anime.schedule_day && anime.schedule_time && (
                <div>
                  <p className="text-muted-foreground">Schedule</p>
                  <p className="font-semibold">{anime.schedule_day} at {anime.schedule_time}</p>
                </div>
              )}
            </div>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre: string) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {anime.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
                <p className="text-foreground/80 leading-relaxed">
                  {anime.description}
                </p>
              </div>
            )}

            {/* Watch Button */}
            {episodes && episodes.length > 0 && (
              <Link to={`/watch/${episodes[0].id}`}>
                <Button size="lg" className="gap-2 bg-gradient-primary hover:opacity-90 glow-purple">
                  <Play className="h-5 w-5" />
                  Watch Episode 1
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Episodes List */}
        {episodes && episodes.length > 0 && (
          <div className="mt-12 space-y-4">
            <h2 className="text-2xl font-bold">Episodes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodes.map((episode) => (
                <Link key={episode.id} to={`/watch/${episode.id}`}>
                  <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-card">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 h-16 rounded bg-gradient-primary flex items-center justify-center text-xl font-bold">
                        {episode.episode_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold line-clamp-1">
                          Episode {episode.episode_number}
                          {episode.title && `: ${episode.title}`}
                        </h3>
                        {episode.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {episode.description}
                          </p>
                        )}
                        {episode.duration && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {Math.floor(episode.duration / 60)} min
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeDetail;
