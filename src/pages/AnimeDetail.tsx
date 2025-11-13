import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AnimeSection } from "@/components/AnimeSection";
import { Comments } from "@/components/Comments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, Star, Calendar, TrendingUp, Loader2, Clock, 
  Heart, Share2, SkipForward, ChevronDown, ChevronUp,
  ExternalLink, Bookmark, ThumbsUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AnimeDetail = () => {
  const { id: slugOrId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState("episodes");

  // Fetch anime details by slug or ID
  const { data: anime, isLoading: animeLoading } = useQuery({
    queryKey: ["anime", slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;
      
      // Enhanced query with additional data
      const { data, error } = await supabase
        .from("anime")
        .select(`
          *,
          favorites(count),
          anime_views(count)
        `)
        .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slugOrId,
  });

  // Track view count
  useEffect(() => {
    if (anime?.id) {
      const trackView = async () => {
        await supabase.from('anime_views').insert({
          anime_id: anime.id,
          user_id: user?.id || null,
        });
      };
      trackView();
    }
  }, [anime?.id, user]);

  // Fetch episodes with enhanced data
  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ["episodes", anime?.slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*, episode_views(count)")
        .eq("anime_slug", anime.slug)
        .order("season_number", { ascending: true })
        .order("episode_number", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!anime?.slug,
  });

  // Fetch recommended anime with better filtering
  const { data: recommendedAnime } = useQuery({
    queryKey: ['recommended', anime?.id],
    queryFn: async () => {
      if (!anime?.genres || anime.genres.length === 0) return [];
      
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .neq('id', anime.id)
        .in('genres', anime.genres.slice(0, 3))
        .order('rating', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
    enabled: !!anime?.genres
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

  // Toggle favorite with optimistic updates
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
    onMutate: async () => {
      // Optimistic update
      setIsFavorited(!isFavorited);
    },
    onSuccess: () => {
      toast({
        title: isFavorited ? 'Removed from favorites' : 'Added to favorites',
        description: isFavorited ? '' : '❤️ Added to your collection',
      });
    },
    onError: (error: any) => {
      // Revert on error
      setIsFavorited(!isFavorited);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Share anime with enhanced tracking
  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${anime?.title} on AnimeFlow!`;
    
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
      toast({ 
        title: 'Link copied!', 
        description: 'Share it with your friends' 
      });
    } else {
      window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
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

  // Loading state
  if (animeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navbar />
        <div className="container px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Cover Image Skeleton */}
            <div className="md:col-span-1">
              <Skeleton className="w-full aspect-[3/4] rounded-2xl" />
              <div className="mt-6 space-y-3">
                <Skeleton className="w-full h-12 rounded-xl" />
                <div className="flex gap-2">
                  <Skeleton className="flex-1 h-12 rounded-xl" />
                  <Skeleton className="w-12 h-12 rounded-xl" />
                </div>
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-12 w-3/4 rounded-lg" />
              <Skeleton className="h-6 w-1/2 rounded-lg" />
              <div className="flex gap-3">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navbar />
        <div className="container px-4 py-16 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
              <span className="text-2xl">🎌</span>
            </div>
            <h1 className="text-3xl font-bold">Anime Not Found</h1>
            <p className="text-muted-foreground">
              The anime you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/">
              <Button size="lg" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Browse Anime
              </Button>
            </Link>
          </div>
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
  const shouldTruncate = descriptionParagraphs.length > 3 || (anime.description?.length || 0) > 400;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      {/* Enhanced Banner Section with Parallax */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-700 ease-out"
          style={{
            backgroundImage: `url(${anime.banner_image || anime.cover_image || "/placeholder.svg"})`,
            transform: 'scale(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        
        {/* Floating Info Overlay */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="max-w-4xl">
            <Badge variant="secondary" className="mb-4 backdrop-blur-sm bg-background/50">
              {anime.type} • {anime.status}
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black mb-4 text-white drop-shadow-2xl">
              {anime.title}
            </h1>
            {anime.title_english && (
              <p className="text-xl text-white/90 mb-2 drop-shadow-lg">{anime.title_english}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container px-4 -mt-32 relative z-10">
        <div className="grid lg:grid-cols-4 gap-8 mb-12">
          {/* Cover Image & Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Enhanced Cover Image */}
              <div className="relative group">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={anime.cover_image || "/placeholder.svg"} 
                    alt={anime.title}
                    className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Rating Overlay */}
                  {anime.rating && anime.rating > 0 && (
                    <div className="absolute top-4 right-4 backdrop-blur-md bg-black/60 rounded-full p-3 border border-white/20">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-white font-bold text-sm">
                          {anime.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Enhanced Action Buttons */}
              <div className="space-y-3">
                {episodes && episodes.length > 0 && anime && (
                  <Link to={`/watch/${anime.slug || anime.id}/${episodes[0].id}`}>
                    <Button size="lg" className="w-full gap-3 h-14 bg-gradient-primary hover:shadow-lg transition-all duration-300">
                      <Play className="h-5 w-5 fill-current" />
                      <span className="font-semibold">Watch Now</span>
                    </Button>
                  </Link>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="lg"
                    variant={isFavorited ? "default" : "outline"}
                    className="h-12 gap-2 transition-all duration-300"
                    onClick={() => favoriteMutation.mutate()}
                    disabled={!user || favoriteMutation.isPending}
                  >
                    {favoriteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                    )}
                    {isFavorited ? 'Saved' : 'Save'}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="lg" variant="outline" className="h-12 gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleShare('twitter')} className="gap-2">
                        <span className="text-blue-400">🐦</span>
                        Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('facebook')} className="gap-2">
                        <span className="text-blue-600">📘</span>
                        Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('reddit')} className="gap-2">
                        <span className="text-orange-500">🤖</span>
                        Reddit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('copy')} className="gap-2">
                        <span>📋</span>
                        Copy Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Quick Stats */}
              <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="secondary">{anime.status}</Badge>
                  </div>
                  {anime.total_episodes && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Episodes</span>
                      <span className="font-semibold">{anime.total_episodes}</span>
                    </div>
                  )}
                  {anime.release_year && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Year</span>
                      <span className="font-semibold">{anime.release_year}</span>
                    </div>
                  )}
                  {anime.studio && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Studio</span>
                      <span className="font-semibold text-right">{anime.studio}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Enhanced Header Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {anime.title}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {anime.title_english && (
                    <span className="text-lg">{anime.title_english}</span>
                  )}
                  {anime.title_japanese && (
                    <span className="text-sm font-japanese">{anime.title_japanese}</span>
                  )}
                </div>
              </div>

              {/* Enhanced Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="px-3 py-1.5 text-sm font-semibold">
                  {anime.type}
                </Badge>
                {anime.is_trending && (
                  <Badge variant="destructive" className="gap-2 px-3 py-1.5">
                    <TrendingUp className="h-3 w-3" />
                    Trending
                  </Badge>
                )}
                {anime.genres?.slice(0, 4).map((genre: string) => (
                  <Badge 
                    key={genre} 
                    variant="secondary"
                    className="px-3 py-1.5 text-sm hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    {genre}
                  </Badge>
                ))}
                {anime.genres && anime.genres.length > 4 && (
                  <Badge variant="outline" className="px-3 py-1.5 text-sm">
                    +{anime.genres.length - 4} more
                  </Badge>
                )}
              </div>

              {/* Enhanced Synopsis */}
              {anime.description && (
                <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Bookmark className="h-5 w-5 text-primary" />
                      Synopsis
                    </h3>
                    <div className="space-y-3 text-muted-foreground leading-relaxed">
                      {(showFullDescription ? descriptionParagraphs : descriptionParagraphs.slice(0, 3)).map((paragraph, index) => (
                        <p key={index} className="text-justify">{paragraph}</p>
                      ))}
                      {shouldTruncate && (
                        <Button
                          variant="ghost"
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="gap-2 text-primary hover:text-primary/80 px-0"
                        >
                          {showFullDescription ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Read More
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Enhanced Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 p-1 bg-muted/50 rounded-2xl">
                <TabsTrigger value="episodes" className="rounded-xl gap-2">
                  <Play className="h-4 w-4" />
                  Episodes
                </TabsTrigger>
                <TabsTrigger value="details" className="rounded-xl gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="comments" className="rounded-xl gap-2">
                  <span>💬</span>
                  Comments
                </TabsTrigger>
              </TabsList>

              {/* Episodes Tab */}
              <TabsContent value="episodes" className="space-y-6">
                {episodesBySeason && Object.keys(episodesBySeason).length > 0 ? (
                  Object.entries(episodesBySeason)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([season, seasonEpisodes]) => (
                      <div key={season} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-1 w-8 bg-gradient-primary rounded-full" />
                          <h3 className="text-2xl font-bold">Season {season}</h3>
                          <Badge variant="outline" className="ml-2">
                            {seasonEpisodes.length} episodes
                          </Badge>
                        </div>
                        <div className="grid gap-3">
                          {seasonEpisodes.map((episode: any) => (
                            <Link
                              key={episode.id}
                              to={`/watch/${anime.slug || anime.id}/${episode.id}`}
                              className="group block"
                            >
                              <Card className="p-4 border-border/30 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
                                <div className="flex gap-4 items-start">
                                  {/* Episode Thumbnail */}
                                  <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                    {episode.thumbnail ? (
                                      <>
                                        <img
                                          src={episode.thumbnail}
                                          alt={`Episode ${episode.episode_number}`}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                      </>
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-primary">
                                          {episode.episode_number}
                                        </span>
                                      </div>
                                    )}
                                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                                      <Badge variant="secondary" className="bg-black/80 text-white border-0 text-xs">
                                        EP {episode.episode_number}
                                      </Badge>
                                      {episode.duration && (
                                        <Badge variant="secondary" className="bg-black/80 text-white border-0 text-xs">
                                          {Math.floor(episode.duration / 60)}m
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                                        <Play className="h-5 w-5 text-white fill-current" />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Episode Info */}
                                  <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                                        Episode {episode.episode_number}
                                        {episode.title && `: ${episode.title}`}
                                      </h4>
                                      {episode.episode_views && episode.episode_views[0]?.count > 0 && (
                                        <Badge variant="outline" className="text-xs flex-shrink-0">
                                          {episode.episode_views[0].count} views
                                        </Badge>
                                      )}
                                    </div>
                                    {episode.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {episode.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Episodes Available</h3>
                    <p className="text-muted-foreground">Check back later for new episodes.</p>
                  </div>
                )}
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Anime Information</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Type', value: anime.type },
                        { label: 'Status', value: anime.status },
                        { label: 'Studio', value: anime.studio },
                        { label: 'Release Year', value: anime.release_year },
                        { label: 'Total Episodes', value: anime.total_episodes },
                        { label: 'Schedule', value: anime.schedule_day && anime.schedule_time ? `${anime.schedule_day}s ${anime.schedule_time}` : null },
                      ].map((item, index) => item.value && (
                        <div key={index} className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Statistics</h4>
                    <div className="space-y-4">
                      {anime.rating && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rating</span>
                            <span className="font-medium flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              {anime.rating.toFixed(1)}/10
                            </span>
                          </div>
                          <Progress value={anime.rating * 10} className="h-2" />
                        </div>
                      )}
                      {anime.favorites && (
                        <div className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground">Favorites</span>
                          <span className="font-medium">{anime.favorites[0]?.count || 0}</span>
                        </div>
                      )}
                      {anime.anime_views && (
                        <div className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground">Total Views</span>
                          <span className="font-medium">{anime.anime_views[0]?.count || 0}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments">
                <Comments animeId={anime.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Enhanced Recommendations */}
        {recommendedAnime && recommendedAnime.length > 0 && (
          <div className="mb-12">
            <AnimeSection
              title="Similar Anime You Might Like"
              description="Based on your current selection"
              animes={recommendedAnime}
              layout="grid"
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AnimeDetail;
