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
  ExternalLink, Bookmark, ThumbsUp, Sparkles, Eye,
  Users, CalendarDays, Timer, Volume2
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
  const [scrolled, setScrolled] = useState(false);

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch anime details by slug or ID
  const { data: anime, isLoading: animeLoading } = useQuery({
    queryKey: ["anime", slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;
      
      const { data, error } = await supabase
        .from("anime")
        .select(`
          *,
          favorites(count),
          anime_views(count),
          comments(count)
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

  // Fetch recommended anime
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
      setIsFavorited(!isFavorited);
    },
    onSuccess: () => {
      toast({
        title: isFavorited ? 'Removed from favorites' : 'Added to favorites',
        description: isFavorited ? '' : '❤️ Added to your collection',
      });
    },
    onError: (error: any) => {
      setIsFavorited(!isFavorited);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="container px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="w-full aspect-[3/4] rounded-3xl" />
              <div className="mt-6 space-y-3">
                <Skeleton className="w-full h-14 rounded-2xl" />
                <div className="flex gap-2">
                  <Skeleton className="flex-1 h-12 rounded-2xl" />
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-16 w-3/4 rounded-2xl" />
              <Skeleton className="h-6 w-1/2 rounded-2xl" />
              <div className="flex gap-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-24 rounded-full" />
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="container px-4 py-16 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-24 h-24 mx-auto bg-purple-500/20 rounded-3xl flex items-center justify-center">
              <span className="text-4xl">🎌</span>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Anime Not Found
            </h1>
            <p className="text-purple-200/80 text-lg">
              The anime you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/">
              <Button size="lg" className="gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 px-8 rounded-2xl">
                <ExternalLink className="h-5 w-5" />
                Browse Anime
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDescription = (text: string) => {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim() !== '');
  };

  const descriptionParagraphs = formatDescription(anime.description || '');
  const shouldTruncate = descriptionParagraphs.length > 3 || (anime.description?.length || 0) > 400;

  // Stats items for the hero section
  const stats = [
    { icon: Star, value: anime.rating?.toFixed(1), label: 'Rating' },
    { icon: Users, value: anime.favorites?.[0]?.count || 0, label: 'Favorites' },
    { icon: Eye, value: anime.anime_views?.[0]?.count || 0, label: 'Views' },
    { icon: Volume2, value: anime.comments?.[0]?.count || 0, label: 'Comments' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />

      {/* Enhanced Hero Section with Glass Morphism */}
      <div className="relative h-[85vh] w-full overflow-hidden">
        {/* Background with multiple layers */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${anime.banner_image || anime.cover_image || "/placeholder.svg"})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-slate-900/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-slate-900" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-conic from-purple-500/10 via-transparent to-pink-500/10 animate-spin-slow" />
        </div>

        {/* Floating Content */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container px-4 pb-12">
            <div className="grid lg:grid-cols-2 gap-12 items-end">
              {/* Text Content */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <Badge variant="secondary" className="glass-effect border-white/20 text-white/90 px-4 py-2 text-sm font-semibold">
                    {anime.type} • {anime.status}
                  </Badge>
                  
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-none">
                    <span className="bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
                      {anime.title}
                    </span>
                  </h1>
                  
                  {anime.title_english && (
                    <p className="text-xl text-purple-200/90 font-medium">
                      {anime.title_english}
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
                  {stats.map((stat, index) => (
                    <div key={index} className="glass-effect rounded-2xl p-4 border border-white/10 backdrop-blur-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className="h-4 w-4 text-purple-300" />
                        <span className="text-white font-bold text-lg">{stat.value}</span>
                      </div>
                      <span className="text-purple-200/70 text-xs font-medium">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {episodes && episodes.length > 0 && anime && (
                    <Link to={`/watch/${anime.slug || anime.id}/${episodes[0].id}`}>
                      <Button size="lg" className="gap-3 h-14 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
                        <Play className="h-5 w-5 fill-current" />
                        <span className="font-bold text-lg">Watch Now</span>
                      </Button>
                    </Link>
                  )}
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-3 h-14 px-6 rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl"
                    onClick={() => favoriteMutation.mutate()}
                    disabled={!user || favoriteMutation.isPending}
                  >
                    {favoriteMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Heart className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                    )}
                    <span className="font-semibold">{isFavorited ? 'Saved' : 'Save'}</span>
                  </Button>
                </div>
              </div>

              {/* Cover Image with Glow Effect */}
              <div className="relative flex justify-end">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                  <img 
                    src={anime.cover_image || "/placeholder.svg"} 
                    alt={anime.title}
                    className="relative w-80 h-[28rem] object-cover rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Rating Badge */}
                  {anime.rating && anime.rating > 0 && (
                    <div className="absolute top-4 right-4 glass-effect rounded-full p-3 border border-white/20 backdrop-blur-xl">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-white font-bold text-lg">
                          {anime.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-20">
        <div className="container px-4">
          <div className="grid lg:grid-cols-4 gap-8 mb-16">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Info Card */}
              <Card className="glass-effect border-white/10 backdrop-blur-xl rounded-3xl p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Quick Info
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: CalendarDays, label: 'Year', value: anime.release_year },
                    { icon: Timer, label: 'Episodes', value: anime.total_episodes },
                    { icon: Users, label: 'Studio', value: anime.studio },
                  ].map((item, index) => item.value && (
                    <div key={index} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-purple-400" />
                      <div className="flex-1">
                        <div className="text-white/70 text-sm">{item.label}</div>
                        <div className="text-white font-semibold">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Genres */}
              <Card className="glass-effect border-white/10 backdrop-blur-xl rounded-3xl p-6">
                <h3 className="font-bold text-white mb-4">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {anime.genres?.map((genre: string) => (
                    <Badge 
                      key={genre}
                      variant="secondary"
                      className="bg-purple-500/20 text-purple-200 border-purple-500/30 hover:bg-purple-500/30 transition-colors cursor-pointer rounded-lg px-3 py-1"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Share Card */}
              <Card className="glass-effect border-white/10 backdrop-blur-xl rounded-3xl p-6">
                <h3 className="font-bold text-white mb-4">Share</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['twitter', 'facebook', 'reddit', 'copy'].map((platform) => (
                    <Button
                      key={platform}
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 h-10 border-white/20 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                      onClick={() => handleShare(platform)}
                    >
                      <span className="text-lg">
                        {platform === 'twitter' && '🐦'}
                        {platform === 'facebook' && '📘'}
                        {platform === 'reddit' && '🤖'}
                        {platform === 'copy' && '📋'}
                      </span>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Synopsis */}
              {anime.description && (
                <Card className="glass-effect border-white/10 backdrop-blur-xl rounded-3xl p-8">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Bookmark className="h-6 w-6 text-purple-400" />
                      Synopsis
                    </h3>
                    <div className="space-y-4 text-white/80 leading-relaxed">
                      {(showFullDescription ? descriptionParagraphs : descriptionParagraphs.slice(0, 3)).map((paragraph, index) => (
                        <p key={index} className="text-justify">{paragraph}</p>
                      ))}
                      {shouldTruncate && (
                        <Button
                          variant="ghost"
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="gap-2 text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 px-0"
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

              {/* Enhanced Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="glass-effect border-white/10 backdrop-blur-xl rounded-2xl p-1 w-full grid grid-cols-3">
                  <TabsTrigger 
                    value="episodes" 
                    className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                  >
                    <Play className="h-4 w-4" />
                    Episodes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="details" 
                    className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comments" 
                    className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                  >
                    <span>💬</span>
                    Comments
                  </TabsTrigger>
                </TabsList>

                {/* Episodes Tab */}
                <TabsContent value="episodes" className="space-y-8">
                  {episodesBySeason && Object.keys(episodesBySeason).length > 0 ? (
                    Object.entries(episodesBySeason)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([season, seasonEpisodes]) => (
                        <div key={season} className="space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                            <h3 className="text-2xl font-bold text-white">Season {season}</h3>
                            <Badge variant="outline" className="glass-effect border-white/20 text-white/80">
                              {seasonEpisodes.length} episodes
                            </Badge>
                          </div>
                          
                          <div className="grid gap-4">
                            {seasonEpisodes.map((episode: any) => (
                              <Link
                                key={episode.id}
                                to={`/watch/${anime.slug || anime.id}/${episode.id}`}
                                className="group block"
                              >
                                <Card className="glass-effect border-white/10 backdrop-blur-xl hover:border-purple-500/50 hover:bg-white/5 transition-all duration-300 rounded-2xl p-0 overflow-hidden">
                                  <div className="flex gap-6">
                                    {/* Episode Thumbnail */}
                                    <div className="relative w-48 h-28 flex-shrink-0">
                                      {episode.thumbnail ? (
                                        <>
                                          <img
                                            src={episode.thumbnail}
                                            alt={`Episode ${episode.episode_number}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                                        </>
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                          <span className="text-2xl font-bold text-white">
                                            {episode.episode_number}
                                          </span>
                                        </div>
                                      )}
                                      
                                      <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                        <Badge className="bg-black/80 text-white border-0 text-xs">
                                          EP {episode.episode_number}
                                        </Badge>
                                        {episode.duration && (
                                          <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                                            {Math.floor(episode.duration / 60)}m
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                                          <Play className="h-6 w-6 text-white fill-current" />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Episode Info */}
                                    <div className="flex-1 py-4 pr-6 min-w-0">
                                      <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-4">
                                          <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1 text-lg">
                                            Episode {episode.episode_number}
                                            {episode.title && `: ${episode.title}`}
                                          </h4>
                                          {episode.episode_views && episode.episode_views[0]?.count > 0 && (
                                            <Badge variant="outline" className="glass-effect border-white/20 text-white/80 text-xs">
                                              {episode.episode_views[0].count} views
                                            </Badge>
                                          )}
                                        </div>
                                        
                                        {episode.description && (
                                          <p className="text-white/70 line-clamp-2 text-sm leading-relaxed">
                                            {episode.description}
                                          </p>
                                        )}
                                        
                                        <div className="flex items-center gap-4 text-xs text-white/60">
                                          <span>Season {episode.season_number || 1}</span>
                                          {episode.air_date && (
                                            <span>{new Date(episode.air_date).toLocaleDateString()}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 mx-auto bg-purple-500/20 rounded-3xl flex items-center justify-center mb-6">
                        <Play className="h-10 w-10 text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">No Episodes Available</h3>
                      <p className="text-purple-200/80">Check back later for new episodes.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <Card className="glass-effect border-white/10 backdrop-blur-xl rounded-3xl p-8">
                      <h4 className="font-bold text-white text-xl mb-6">Anime Information</h4>
                      <div className="space-y-4">
                        {[
                          { label: 'Type', value: anime.type, icon: '🎬' },
                          { label: 'Status', value: anime.status, icon: '📊' },
                          { label: 'Studio', value: anime.studio, icon: '🏢' },
                          { label: 'Release Year', value: anime.release_year, icon: '📅' },
                          { label: 'Total Episodes', value: anime.total_episodes, icon: '🎞️' },
                          { label: 'Schedule', value: anime.schedule_day && anime.schedule_time ? `${anime.schedule_day}s ${anime.schedule_time}` : null, icon: '⏰' },
                        ].map((item, index) => item.value && (
                          <div key={index} className="flex items-center justify-between py-3 border-b border-white/10">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{item.icon}</span>
                              <span className="text-white/80">{item.label}</span>
                            </div>
                            <span className="text-white font-semibold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                    
                    <Card className="glass-effect border-white/10 backdrop-blur-xl rounded-3xl p-8">
                      <h4 className="font-bold text-white text-xl mb-6">Statistics</h4>
                      <div className="space-y-6">
                        {anime.rating && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-white/80">Rating</span>
                              <span className="text-white font-semibold flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {anime.rating.toFixed(1)}/10
                              </span>
                            </div>
                            <Progress value={anime.rating * 10} className="h-2 bg-white/10" />
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          {[
                            { label: 'Favorites', value: anime.favorites?.[0]?.count || 0, icon: '❤️' },
                            { label: 'Total Views', value: anime.anime_views?.[0]?.count || 0, icon: '👁️' },
                            { label: 'Comments', value: anime.comments?.[0]?.count || 0, icon: '💬' },
                          ].map((stat, index) => (
                            <div key={index} className="flex justify-between items-center py-2">
                              <div className="flex items-center gap-3">
                                <span>{stat.icon}</span>
                                <span className="text-white/80">{stat.label}</span>
                              </div>
                              <span className="text-white font-semibold">{stat.value}</span>
                            </div>
                          ))}
                        </div>
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
            <div className="mb-16">
              <div className="space-y-6 mb-8">
                <h2 className="text-4xl font-black text-white text-center">
                  Similar Anime You Might Like
                </h2>
                <p className="text-purple-200/80 text-center text-lg max-w-2xl mx-auto">
                  Based on your current selection and viewing preferences
                </p>
              </div>
              <AnimeSection
                title=""
                description=""
                animes={recommendedAnime}
                layout="grid"
              />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

// Add custom CSS for glass effect
const styles = `
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 20s linear infinite;
}

.bg-gradient-conic {
  background: conic-gradient(from 0deg, transparent, currentColor, transparent);
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default AnimeDetail;
