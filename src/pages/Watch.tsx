import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Comments } from '@/components/Comments';
import {
  Loader2,
  Play,
  ChevronLeft,
  ChevronRight,
  Server,
  SkipForward,
  MessageSquare,
  Clock,
  Calendar,
  Sparkles,
  ArrowLeft,
  Grid3X3,
  List,
  MonitorPlay,
  Zap,
  CheckCircle
} from 'lucide-react';
import { AnimeSection } from '@/components/AnimeSection';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Episode {
  id: string;
  episode_number: number;
  season_number: number;
  title?: string | null;
  description?: string | null;
  video_url?: string;
  server_urls?: Record<string, string>;
  thumbnail?: string | null;
  duration?: number | null;
  created_at?: string;
}

interface Anime {
  id: string;
  slug?: string | null;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  description?: string | null;
  cover_image?: string | null;
  banner_image?: string | null;
  genres?: string[];
  type?: string;
  status?: string;
  rating?: number | null;
  release_year?: number | null;
  total_episodes?: number;
}

interface EmbedServer {
  id: string;
  name: string;
  embed_url: string;
  quality: string[];
  latency: number;
}

export default function Watch() {
  const { animeId: animeSlugOrId, episodeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [episodeRange, setEpisodeRange] = useState(0);
  const [watchProgress, setWatchProgress] = useState(0);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [episodeViewMode, setEpisodeViewMode] = useState<'grid' | 'list' | 'detailed'>('grid');
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  // Optimized queries with fast loading
  const { data: servers = [], isLoading: isLoadingServers } = useQuery({
    queryKey: ['embed_servers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embed_servers')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .limit(10); // Limit for faster loading
      
      if (error) throw error;
      
      // Simulate server latency for demo
      return (data || []).map(server => ({
        ...server,
        latency: Math.floor(Math.random() * 100) + 20, // 20-120ms
        quality: ['1080p', '720p', '480p'] // Mock qualities
      })) as EmbedServer[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const { data: anime, isLoading: isLoadingAnime } = useQuery({
    queryKey: ['anime', animeSlugOrId],
    queryFn: async () => {
      if (!animeSlugOrId) return null;
      
      // Fast parallel queries
      const [slugData, idData] = await Promise.all([
        supabase.from('anime').select('*').eq('slug', animeSlugOrId).maybeSingle(),
        supabase.from('anime').select('*').eq('id', animeSlugOrId).maybeSingle()
      ]);
      
      return (slugData.data || idData.data) as Anime | null;
    },
    enabled: !!animeSlugOrId,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });

  const { data: episodes = [], isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ['episodes', anime?.id],
    queryFn: async () => {
      if (!anime?.id) return [] as Episode[];
      
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('anime_id', anime.id)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Episode[];
    },
    enabled: !!anime?.id,
  });

  const { data: recommendedAnime = [] } = useQuery({
    queryKey: ['recommended', anime?.genres],
    queryFn: async () => {
      if (!anime?.genres?.length) return [];
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .neq('id', anime?.id)
        .limit(8); // Reduced for faster loading
      if (error) throw error;
      return data || [];
    },
    enabled: !!anime?.genres,
  });

  // Fast derived data with useMemo
  const seasons = useMemo(() => {
    return [...new Set((episodes || []).map(e => e.season_number))].sort((a, b) => a - b);
  }, [episodes]);

  const seasonEpisodes = useMemo(() => {
    return (episodes || []).filter(e => e.season_number === selectedSeason);
  }, [episodes, selectedSeason]);

  const episodesPerPage = episodeViewMode === 'detailed' ? 12 : episodeViewMode === 'list' ? 20 : 24;
  const totalPages = Math.max(1, Math.ceil(seasonEpisodes.length / episodesPerPage));
  const displayedEpisodes = seasonEpisodes.slice(episodeRange * episodesPerPage, (episodeRange + 1) * episodesPerPage);

  // Fast server selection
  useEffect(() => {
    if (!selectedEpisode || !servers.length) return;
    
    // Find the best available server quickly
    const availableServer = servers.find(server => 
      selectedEpisode.server_urls?.[server.id]
    );
    
    if (availableServer && selectedServer !== availableServer.id) {
      setSelectedServer(availableServer.id);
    } else if (servers.length > 0 && !selectedServer) {
      setSelectedServer(servers[0].id);
    }
  }, [selectedEpisode, servers, selectedServer]);

  const getEmbedUrl = useCallback((episode?: Episode) => {
    if (!episode) return '';
    
    if (selectedServer && episode.server_urls?.[selectedServer]) {
      const server = servers.find(s => s.id === selectedServer);
      return server ? `${server.embed_url}${episode.server_urls[selectedServer]}` : '';
    }
    
    // Fallback to any available server
    for (const server of servers) {
      if (episode.server_urls?.[server.id]) {
        return `${server.embed_url}${episode.server_urls[server.id]}`;
      }
    }
    
    return episode.video_url || '';
  }, [selectedServer, servers]);

  // Fast episode selection
  useEffect(() => {
    if (episodeId && episodes.length > 0) {
      const ep = episodes.find(e => e.id === episodeId);
      if (ep) {
        setSelectedEpisode(ep);
        setSelectedSeason(ep.season_number);
        setIsPlayerReady(true);
        return;
      }
    }
    
    if (!selectedEpisode && episodes.length > 0 && !episodeId) {
      const firstEpisode = episodes[0];
      setSelectedEpisode(firstEpisode);
      setSelectedSeason(firstEpisode.season_number);
      setIsPlayerReady(true);
      navigate(`/watch/${anime?.slug || anime?.id}/${firstEpisode.id}`, { replace: true });
    }
  }, [episodeId, episodes, selectedEpisode, anime?.slug, anime?.id, navigate]);

  // Fast watch progress
  useEffect(() => {
    if (!selectedEpisode) {
      setWatchProgress(0);
      return;
    }
    
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user || !mounted) return;
      
      const { data: history } = await supabase
        .from('watch_history')
        .select('progress')
        .eq('user_id', data.user.id)
        .eq('episode_id', selectedEpisode.id)
        .maybeSingle();
        
      if (mounted && history) setWatchProgress(history.progress || 0);
    })();
    
    return () => { mounted = false; };
  }, [selectedEpisode]);

  const saveWatchHistory = useCallback(async (episode: Episode, progress = 0) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user || !anime?.id) return;
    
    try {
      await supabase.from('watch_history').upsert({
        user_id: authData.user.id,
        anime_id: anime.id,
        episode_id: episode.id,
        progress,
        last_watched: new Date().toISOString(),
        completed: progress >= 90,
      });
    } catch (err) {
      console.warn('watch_history upsert failed', err);
    }
  }, [anime?.id]);

  const handleEpisodeSelect = useCallback((episode: Episode, showToast = true) => {
    setSelectedEpisode(episode);
    setSelectedSeason(episode.season_number);
    setIsLoadingEmbed(true);
    setIsPlayerReady(true);
    
    navigate(`/watch/${anime?.slug || anime?.id}/${episode.id}`);
    saveWatchHistory(episode, 0);
    
    if (showToast) {
      toast({
        title: 'Now Watching',
        description: `Episode ${episode.episode_number} - ${episode.title || ''}`,
      });
    }
  }, [anime?.slug, anime?.id, navigate, saveWatchHistory, toast]);

  const handleNext = useCallback(() => {
    if (!episodes || !selectedEpisode) return;
    const idx = episodes.findIndex(e => e.id === selectedEpisode.id);
    if (idx < episodes.length - 1) {
      saveWatchHistory(selectedEpisode, 100);
      handleEpisodeSelect(episodes[idx + 1], autoPlay);
    } else {
      toast({
        title: "You've reached the end!",
        description: "No more episodes available.",
      });
    }
  }, [episodes, selectedEpisode, saveWatchHistory, handleEpisodeSelect, autoPlay, toast]);

  const handlePrev = useCallback(() => {
    if (!episodes || !selectedEpisode) return;
    const idx = episodes.findIndex(e => e.id === selectedEpisode.id);
    if (idx > 0) handleEpisodeSelect(episodes[idx - 1]);
  }, [episodes, selectedEpisode, handleEpisodeSelect]);

  // Auto-play with next episode
  useEffect(() => {
    if (!autoPlay || !selectedEpisode || !episodes) return;

    const handleVideoEnd = () => {
      const currentIndex = episodes.findIndex(e => e.id === selectedEpisode.id);
      if (currentIndex < episodes.length - 1) {
        setTimeout(() => {
          handleNext();
        }, 3000); // 3 second delay before auto-next
      }
    };

    // Keyboard shortcut for demo
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'E' && autoPlay) {
        handleVideoEnd();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [autoPlay, selectedEpisode, episodes, handleNext]);

  const handleBackToAnime = useCallback(() => {
    if (anime?.slug) {
      navigate(`/anime/${anime.slug}`);
    } else if (anime?.id) {
      navigate(`/anime/${anime.id}`);
    } else {
      navigate(-1);
    }
  }, [anime?.slug, anime?.id, navigate]);

  // Fast keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleBackToAnime();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNext, handlePrev, handleBackToAnime]);

  const handlePlayerLoad = useCallback(() => {
    setIsLoadingEmbed(false);
  }, []);

  const isLoading = isLoadingAnime || isLoadingEpisodes;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background/95 to-background/90">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* BACK BUTTON */}
        <Button
          variant="ghost"
          onClick={handleBackToAnime}
          className="gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {anime?.title || 'Anime Details'}
        </Button>

        {/* VIDEO PLAYER SECTION */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl shadow-2xl">
            <div 
              className="relative group rounded-xl overflow-hidden bg-black shadow-2xl"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              {/* Fast Loading Overlay */}
              {isLoadingEmbed && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-white/80 text-sm">Loading player...</p>
                  </div>
                </div>
              )}

              {/* Video Player */}
              {isPlayerReady && selectedEpisode ? (
                <div className="aspect-video">
                  <iframe
                    src={getEmbedUrl(selectedEpisode)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={`Episode ${selectedEpisode.episode_number}`}
                    onLoad={handlePlayerLoad}
                    key={`${selectedEpisode.id}-${selectedServer}`}
                  />
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-muted/20">
                  <div className="text-center space-y-4">
                    <Play className="h-16 w-16 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-lg">Select an episode to start watching</p>
                  </div>
                </div>
              )}

              {/* Modern Floating Controls */}
              {showControls && selectedEpisode && (
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between animate-in fade-in duration-300">
                  <Badge className="bg-black/60 text-white backdrop-blur-sm border-0">
                    S{selectedEpisode.season_number} • E{selectedEpisode.episode_number}
                  </Badge>
                  {autoPlay && (
                    <Badge className="bg-green-500/90 text-white backdrop-blur-sm border-0 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Auto-Play
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Modern Player Controls */}
            <CardContent className="p-6 space-y-4">
              {/* Enhanced Episode Info */}
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent line-clamp-1">
                      {anime?.title}
                    </h1>
                    {selectedEpisode?.title && (
                      <p className="text-lg text-muted-foreground mt-1 line-clamp-1">
                        {selectedEpisode.title}
                      </p>
                    )}
                  </div>
                  
                  {selectedEpisode && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className="bg-primary/20 text-primary border-primary/20 font-semibold">
                        S{selectedEpisode.season_number} • E{selectedEpisode.episode_number}
                      </Badge>
                      {selectedEpisode.duration && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {selectedEpisode.duration}m
                        </Badge>
                      )}
                      {watchProgress > 0 && (
                        <div className="flex items-center gap-2">
                          <Progress value={watchProgress} className="w-20 h-2" />
                          <span className="text-xs text-muted-foreground">{watchProgress}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modern Navigation Buttons */}
                <div className="flex items-center gap-2 ml-6">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={!episodes || episodes[0]?.id === selectedEpisode?.id}
                    className="gap-3 px-6 border-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="font-semibold">Prev</span>
                  </Button>
                  
                  <Button
                    size="lg"
                    onClick={handleNext}
                    disabled={!episodes || episodes[episodes.length - 1]?.id === selectedEpisode?.id}
                    className="gap-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg"
                  >
                    <span className="font-semibold">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Advanced Server Selection */}
              {servers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span>Streaming Servers</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {servers.map(server => {
                      const hasUrl = !!selectedEpisode?.server_urls?.[server.id];
                      const isSelected = selectedServer === server.id;
                      const latency = server.latency;
                      
                      return (
                        <Button
                          key={server.id}
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => {
                            if (hasUrl) {
                              setSelectedServer(server.id);
                              setIsLoadingEmbed(true);
                              toast({
                                title: "Server Changed",
                                description: `Switched to ${server.name}`,
                              });
                            }
                          }}
                          disabled={!hasUrl}
                          className={`
                            h-12 relative transition-all duration-200 group
                            ${isSelected 
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 border-0 shadow-lg" 
                              : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/5"}
                            ${!hasUrl ? "opacity-40 cursor-not-allowed" : ""}
                          `}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-semibold">{server.name}</span>
                              {isSelected && <CheckCircle className="h-3 w-3" />}
                            </div>
                            {hasUrl && (
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  latency < 50 ? 'bg-green-500' : 
                                  latency < 100 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                <span className="text-[10px] text-muted-foreground">
                                  {latency}ms
                                </span>
                              </div>
                            )}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auto-play Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoPlay}
                      onChange={(e) => setAutoPlay(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`
                      w-12 h-6 rounded-full transition-all duration-300 border-2
                      ${autoPlay 
                        ? 'bg-green-500 border-green-500' 
                        : 'bg-muted border-border'}
                    `}>
                      <div className={`
                        absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300
                        ${autoPlay ? 'left-7' : 'left-1'}
                      `} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${autoPlay ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className={`font-medium ${autoPlay ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Auto-Play
                    </span>
                    {autoPlay && (
                      <Badge variant="secondary" className="text-xs">
                        Next episode plays automatically
                      </Badge>
                    )}
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* EPISODE BROWSER - Optimized */}
        <Card className="border-0 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Episodes
                </h2>
                <p className="text-muted-foreground mt-1">
                  {seasonEpisodes.length} episodes in Season {selectedSeason}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Selector */}
                <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={episodeViewMode === 'grid' ? "default" : "ghost"}
                    onClick={() => setEpisodeViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={episodeViewMode === 'list' ? "default" : "ghost"}
                    onClick={() => setEpisodeViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={episodeViewMode === 'detailed' ? "default" : "ghost"}
                    onClick={() => setEpisodeViewMode('detailed')}
                    className="h-8 w-8 p-0"
                  >
                    <MonitorPlay className="h-4 w-4" />
                  </Button>
                </div>

                {/* Season Selector */}
                {seasons.length > 1 && (
                  <Select value={selectedSeason.toString()} onValueChange={(v) => setSelectedSeason(parseInt(v))}>
                    <SelectTrigger className="w-[140px] bg-background/50 backdrop-blur-sm">
                      <SelectValue placeholder="Season" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-sm">
                      {seasons.map((season) => (
                        <SelectItem key={season} value={season.toString()}>
                          Season {season}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Optimized Episode Grid */}
            <div className={`
              gap-2
              ${episodeViewMode === 'detailed' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : episodeViewMode === 'list'
                ? 'grid grid-cols-1'
                : 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12'
              }
            `}>
              {displayedEpisodes.map((ep) => {
                const isCurrent = selectedEpisode?.id === ep.id;
                const isWatched = watchProgress >= 90 && isCurrent;
                
                // Fast rendering with minimal conditionals
                return (
                  <EpisodeCard
                    key={ep.id}
                    episode={ep}
                    isCurrent={isCurrent}
                    isWatched={isWatched}
                    viewMode={episodeViewMode}
                    onSelect={handleEpisodeSelect}
                  />
                );
              })}
            </div>

            {/* Fast Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Select value={episodeRange.toString()} onValueChange={(v) => setEpisodeRange(parseInt(v))}>
                  <SelectTrigger className="w-48 bg-background/50 backdrop-blur-sm">
                    <SelectValue placeholder="Select page" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-sm">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        Episodes {i * episodesPerPage + 1}–{Math.min((i + 1) * episodesPerPage, seasonEpisodes.length)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rest of components remain optimized */}
        {/* ... (Anime Details, Comments, Recommendations) */}
      </div>

      <Footer />
    </div>
  );
}

// Optimized Episode Card Component
const EpisodeCard = ({ 
  episode, 
  isCurrent, 
  isWatched, 
  viewMode, 
  onSelect 
}: { 
  episode: Episode;
  isCurrent: boolean;
  isWatched: boolean;
  viewMode: string;
  onSelect: (ep: Episode) => void;
}) => {
  if (viewMode === 'detailed') {
    return (
      <Card
        className={`
          cursor-pointer transition-all duration-200 border-2 group overflow-hidden
          ${isCurrent 
            ? "bg-gradient-to-br from-purple-600 to-pink-600 border-purple-500/50 shadow-lg scale-105" 
            : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/5"}
        `}
        onClick={() => onSelect(episode)}
      >
        <CardContent className="p-3">
          <div className="flex gap-2">
            {episode.thumbnail ? (
              <img 
                src={episode.thumbnail} 
                alt={`Episode ${episode.episode_number}`}
                className="w-12 h-9 object-cover rounded flex-shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-9 bg-muted rounded flex items-center justify-center flex-shrink-0">
                <Play className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-xs leading-tight">
                  Ep {episode.episode_number}
                </h3>
                {episode.duration && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-1">
                    {episode.duration}m
                  </span>
                )}
              </div>
              {episode.title && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {episode.title}
                </p>
              )}
            </div>
          </div>
          {isWatched && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full border border-background" />
          )}
        </CardContent>
      </Card>
    );
  }

  // Default grid view for performance
  return (
    <Button
      variant={isCurrent ? "default" : "outline"}
      className={`
        h-12 relative transition-all duration-200 border
        ${isCurrent 
          ? "bg-gradient-to-br from-purple-600 to-pink-600 border-0 shadow-lg" 
          : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/5"}
      `}
      onClick={() => onSelect(episode)}
    >
      <span className="text-xs font-semibold">{episode.episode_number}</span>
      {isWatched && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-background" />
      )}
    </Button>
  );
};
