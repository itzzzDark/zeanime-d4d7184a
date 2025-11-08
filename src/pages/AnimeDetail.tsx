import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimeSection } from "@/components/AnimeSection";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, Star, Calendar, TrendingUp, Loader2, Clock, 
  Bookmark, Heart, Share2, SkipForward, Check 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AnimeDetail = () => {
  const { id: slugOrId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);

  // Fetch anime details by ID
  const { data: anime, isLoading: animeLoading } = useQuery({
    queryKey: ["anime", slugOrId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("id", slugOrId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slugOrId,
  });

  // Fetch episodes
  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ["episodes", anime?.slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("anime_slug", anime.slug)
        .order("season_number", { ascending: true })
        .order("episode_number", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!anime?.slug,
  });

  // Fetch recommended anime based on genres
  const { data: recommendedAnime } = useQuery({
    queryKey: ['recommended', anime?.genres],
    queryFn: async () => {
      if (!anime?.genres || anime.genres.length === 0) return [];
      
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .neq('id', anime.id)
        .limit(12);

      if (error) throw error;
      return data;
    },
    enabled: !!anime?.genres
  });

  // Fetch top 10 anime
  const { data: top10Anime } = useQuery({
    queryKey: ['top10'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .order('rating', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Check favorite status
  useEffect(() => {
    if (user && anime?.id) {
      const checkFavorite = async () => {
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('anime_id', anime.id)
          .maybeSingle();
        setIsFavorited(!!data);
      };
      checkFavorite();
    }
  }, [user, anime?.id]);

  // Check watchlist status
  useEffect(() => {
    if (user && anime?.id) {
      const checkWatchlist = async () => {
        const { data } = await supabase
          .from('watchlist')
          .select('status')
          .eq('user_id', user.id)
          .eq('anime_id', anime.id)
          .maybeSingle();
        setWatchlistStatus(data?.status || null);
      };
      checkWatchlist();
    }
  }, [user, anime?.id]);

  // Toggle favorite
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !anime?.id) throw new Error('Please sign in');
      
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('anime_id', anime.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, anime_id: anime.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setIsFavorited(!isFavorited);
      toast({
        title: isFavorited ? 'Removed from favorites' : 'Added to favorites',
        description: isFavorited ? '' : '❤️',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update watchlist
  const watchlistMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!user || !anime?.id) throw new Error('Please sign in');
      
      const { error } = await supabase
        .from('watchlist')
        .upsert({ 
          user_id: user.id, 
          anime_id: anime.id,
          status 
        });
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      setWatchlistStatus(status);
      toast({
        title: 'List updated',
        description: `Moved to ${status.replace('_', ' ')}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Share anime
  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${anime?.title}!`;
    
    // Track share
    if (user && anime?.id) {
      await supabase.from('anime_shares').insert({
        anime_id: anime.id,
        user_id: user.id,
        platform,
      });
    }

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
      copy: url,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!', description: 'Share it with your friends' });
    } else {
      window.open(shareUrls[platform], '_blank');
    }
  };

  // Group episodes by season
  const episodesBySeason = episodes?.reduce((acc, episode) => {
    const season = episode.season_number || 1;
    if (!acc[season]) {
      acc[season] = [];
    }
    acc[season].push(episode);
    return acc;
  }, {} as Record<number, typeof episodes>);

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

  // Format description with line breaks
  const formatDescription = (text: string) => {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim() !== '');
  };

  const descriptionParagraphs = formatDescription(anime.description || '');
  const shouldTruncate = descriptionParagraphs.length > 3 || (anime.description?.length || 0) > 500;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Banner Section */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={anime.banner_image || anime.cover_image || "/placeholder.svg"} 
            alt={anime.title}
            className="h-full w-full object-cover scale-105 animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-transparent" />
        </div>
      </div>

      {/* Content Section */}
      <div className="container px-4 -mt-40 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Cover Image & Action Buttons */}
          <div className="md:col-span-1">
            <div className="relative group">
              <img 
                src={anime.cover_image || "/placeholder.svg"} 
                alt={anime.title}
                className="w-full rounded-xl shadow-2xl hover-lift transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {episodes && episodes.length > 0 && anime && (
                <Link to={`/watch/${anime.id}/${episodes[0].id}`}>
                  <Button size="lg" className="w-full gap-2 hover-lift">
                    <Play className="h-5 w-5 fill-current" />
                    Watch Episode 1
                  </Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" variant="outline" className="w-full gap-2 hover-lift">
                    {watchlistStatus ? <Check className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                    {watchlistStatus ? watchlistStatus.replace('_', ' ') : 'Add to List'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem onClick={() => watchlistMutation.mutate('watching')}>
                    📺 Watching
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => watchlistMutation.mutate('completed')}>
                    ✅ Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => watchlistMutation.mutate('on_hold')}>
                    ⏸️ On Hold
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => watchlistMutation.mutate('plan_to_watch')}>
                    📋 Plan to Watch
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => watchlistMutation.mutate('dropped')}>
                    ❌ Dropped
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex gap-2">
                <Button 
                  size="lg" 
                  variant={isFavorited ? "default" : "outline"}
                  className="flex-1 gap-2 hover-lift"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={!user}
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Favorited' : 'Favorite'}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="lg" variant="outline" className="gap-2 hover-lift">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleShare('twitter')}>
                      🐦 Twitter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('facebook')}>
                      📘 Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('reddit')}>
                      🤖 Reddit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('copy')}>
                      📋 Copy Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-6 animate-fade-in">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                {anime.title}
              </h1>
              {anime.title_english && (
                <p className="text-2xl text-muted-foreground mb-1">{anime.title_english}</p>
              )}
              {anime.title_japanese && (
                <p className="text-lg text-muted-foreground/70">{anime.title_japanese}</p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="default" className="text-base px-4 py-1.5">
                {anime.type}
              </Badge>
              <Badge variant="secondary" className="text-base px-4 py-1.5">
                {anime.status}
              </Badge>
              {anime.rating && anime.rating > 0 && (
                <Badge variant="outline" className="text-base gap-2 px-4 py-1.5">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  {anime.rating}/10
                </Badge>
              )}
              {anime.is_trending && (
                <Badge variant="destructive" className="text-base gap-2 px-4 py-1.5">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </Badge>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-card/50 backdrop-blur rounded-xl border border-border/50">
              {anime.release_year && (
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Year</p>
                    <p className="font-bold text-foreground text-lg">{anime.release_year}</p>
                  </div>
                </div>
              )}
              {anime.total_episodes && anime.total_episodes > 0 && (
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Episodes</p>
                    <p className="font-bold text-foreground text-lg">{anime.total_episodes}</p>
                  </div>
                </div>
              )}
              {anime.studio && (
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Studio</p>
                    <p className="font-bold text-foreground text-lg truncate">{anime.studio}</p>
                  </div>
                </div>
              )}
              {anime.schedule_day && anime.schedule_time && (
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Schedule</p>
                    <p className="font-bold text-foreground text-sm">
                      {anime.schedule_day}s {anime.schedule_time}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Genres</h3>
                <div className="flex flex-wrap gap-3">
                  {anime.genres.map((genre: string) => (
                    <Badge 
                      key={genre} 
                      variant="secondary"
                      className="text-sm px-4 py-2 hover-lift cursor-pointer"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Synopsis */}
            {anime.description && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Synopsis</h3>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  {(showFullDescription ? descriptionParagraphs : descriptionParagraphs.slice(0, 3)).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                  {shouldTruncate && (
                    <Button
                      variant="link"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="p-0 h-auto text-primary hover:text-primary/80"
                    >
                      {showFullDescription ? 'Show less' : 'Read more...'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Episodes List by Season */}
        {episodesBySeason && Object.keys(episodesBySeason).length > 0 && (
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Play className="h-8 w-8 text-primary" />
              Episodes
            </h2>
            {Object.entries(episodesBySeason)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([season, seasonEpisodes]) => (
                <div key={season} className="space-y-4 animate-fade-in">
                  <h3 className="text-2xl font-bold text-primary">Season {season}</h3>
                  <div className="grid gap-3">
                    {seasonEpisodes.map((episode: any) => (
                      <Link
                        key={episode.id}
                        to={`/watch/${anime.id}/${episode.id}`}
                        className="group block p-4 bg-card hover:bg-card/80 border border-border/50 rounded-xl transition-all hover-lift"
                      >
                        <div className="flex gap-4">
                          {episode.thumbnail ? (
                            <div className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={episode.thumbnail}
                                alt={`Episode ${episode.episode_number}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-2 left-2">
                                <Badge variant="secondary" className="bg-black/80 text-white border-0">
                                  EP {episode.episode_number}
                                </Badge>
                              </div>
                              {episode.duration && (
                                <div className="absolute bottom-2 right-2">
                                  <Badge variant="secondary" className="bg-black/80 text-white border-0 text-xs">
                                    {Math.floor(episode.duration / 60)}m
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-40 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                              <span className="text-2xl font-bold text-primary">{episode.episode_number}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                              Episode {episode.episode_number}
                              {episode.title && `: ${episode.title}`}
                            </h4>
                            {episode.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {episode.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center">
                            <Play className="h-8 w-8 text-primary/60 group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Recommended Anime */}
        {recommendedAnime && recommendedAnime.length > 0 && (
          <div className="mb-12 animate-fade-in">
            <AnimeSection
              title="You Might Also Like"
              animes={recommendedAnime}
              layout="grid"
            />
          </div>
        )}

        {/* Recommended Series */}
        {top10Anime && top10Anime.length > 0 && (
          <div className="mb-12 animate-fade-in">
            <AnimeSection
              title="Recommended Series"
              animes={top10Anime}
              layout="scroll"
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AnimeDetail;