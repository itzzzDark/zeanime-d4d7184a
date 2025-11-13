import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Comments } from '@/components/Comments';
import {
  Loader2,
  Play,
  ChevronLeft,
  ChevronRight,
  Server,
  Maximize,
  Minimize,
  SkipForward,
  PictureInPicture2,
  MessageSquare,
  Clock,
  Eye,
  Calendar,
  Sparkles,
  ThumbsUp,
  Share,
  Bookmark,
  Settings,
  Volume2
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
}

export default function Watch() {
  const { animeId: animeSlugOrId, episodeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [episodeRange, setEpisodeRange] = useState(0);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [watchProgress, setWatchProgress] = useState(0);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Supabase queries
  const { data: servers = [] } = useQuery({
    queryKey: ['embed_servers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embed_servers')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return (data || []) as EmbedServer[];
    },
  });

  const { data: anime, isLoading: isLoadingAnime } = useQuery({
    queryKey: ['anime', animeSlugOrId],
    queryFn: async () => {
      if (!animeSlugOrId) return null;
      const { data, error } = await supabase.from('anime').select('*').eq('slug', animeSlugOrId).maybeSingle();
      if (error) throw error;
      if (data) return data as Anime;
      const res = await supabase.from('anime').select('*').eq('id', animeSlugOrId).maybeSingle();
      if (res.error) throw res.error;
      return res.data as Anime | null;
    },
    enabled: !!animeSlugOrId,
  });

  const { data: episodes = [], isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ['episodes', anime?.slug ?? anime?.id],
    queryFn: async () => {
      if (!anime?.slug && !anime?.id) return [] as Episode[];
      const key = anime?.slug ?? anime?.id;
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .or(`anime_slug.eq.${key},anime_id.eq.${key}`)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true });
      if (error) throw error;
      return (data || []) as Episode[];
    },
    enabled: !!anime,
  });

  const { data: recommendedAnime = [] } = useQuery({
    queryKey: ['recommended', anime?.genres],
    queryFn: async () => {
      if (!anime?.genres?.length) return [];
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .neq('id', anime?.id)
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: !!anime?.genres,
  });

  // Derived data
  const seasons = useMemo(() => {
    return [...new Set((episodes || []).map(e => e.season_number))].sort((a, b) => a - b);
  }, [episodes]);

  useEffect(() => {
    if (seasons.length && !seasons.includes(selectedSeason)) {
      setSelectedSeason(seasons[0]);
    }
  }, [seasons, selectedSeason]);

  const seasonEpisodes = useMemo(() => {
    return (episodes || []).filter(e => e.season_number === selectedSeason);
  }, [episodes, selectedSeason]);

  const episodesPerPage = 100;
  const totalPages = Math.max(1, Math.ceil(seasonEpisodes.length / episodesPerPage));
  const displayedEpisodes = seasonEpisodes.slice(episodeRange * episodesPerPage, (episodeRange + 1) * episodesPerPage);

  // Server selection logic
  useEffect(() => {
    if (!selectedEpisode) return;
    if (selectedServer && selectedEpisode.server_urls?.[selectedServer]) return;
    if (selectedEpisode.server_urls) {
      const keys = Object.keys(selectedEpisode.server_urls);
      for (const id of keys) {
        if (servers.find(s => s.id === id)) {
          setSelectedServer(id);
          return;
        }
      }
    }
    if (servers.length > 0) {
      setSelectedServer(prev => prev || servers[0].id);
    }
  }, [selectedEpisode, servers, selectedServer]);

  const getEmbedUrl = useCallback(
    (episode?: Episode) => {
      if (!episode) return '';
      if (selectedServer && episode.server_urls?.[selectedServer]) {
        const server = servers.find(s => s.id === selectedServer);
        if (server) return `${server.embed_url}${episode.server_urls[selectedServer]}`;
      }
      if (episode.server_urls) {
        for (const sid of Object.keys(episode.server_urls)) {
          const server = servers.find(s => s.id === sid);
          if (server && episode.server_urls[sid]) {
            return `${server.embed_url}${episode.server_urls[sid]}`;
          }
        }
      }
      return episode.video_url || '';
    },
    [selectedServer, servers]
  );

  useEffect(() => {
    if (!selectedServer && servers.length > 0) {
      setSelectedServer(servers[0].id);
    }
  }, [servers, selectedServer]);

  // Episode selection
  useEffect(() => {
    if (episodeId && episodes.length > 0) {
      const ep = episodes.find(e => e.id === episodeId);
      if (ep) {
        setSelectedEpisode(ep);
        setSelectedSeason(ep.season_number);
        return;
      }
    }
    if (!selectedEpisode && episodes.length > 0) {
      setSelectedEpisode(episodes[0]);
      setSelectedSeason(episodes[0].season_number);
    }
  }, [episodeId, episodes, selectedEpisode]);

  // Watch progress
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
    return () => {
      mounted = false;
    };
  }, [selectedEpisode]);

  const saveWatchHistory = useCallback(
    async (episode: Episode, progress = 0) => {
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
    },
    [anime?.id]
  );

  const handleEpisodeSelect = useCallback(
    (episode: Episode, showToast = true) => {
      setSelectedEpisode(episode);
      setSelectedSeason(episode.season_number);
      setIsLoadingEmbed(true);
      navigate(`/watch/${anime?.slug || anime?.id}/${episode.id}`);
      saveWatchHistory(episode, 0);
      if (showToast) {
        toast({
          title: 'Now Watching',
          description: `Episode ${episode.episode_number} - ${episode.title || ''}`,
        });
      }
    },
    [anime?.slug, anime?.id, navigate, saveWatchHistory, toast]
  );

  const handleNext = useCallback(() => {
    if (!episodes || !selectedEpisode) return;
    const idx = episodes.findIndex(e => e.id === selectedEpisode.id);
    if (idx < episodes.length - 1) {
      saveWatchHistory(selectedEpisode, 100);
      handleEpisodeSelect(episodes[idx + 1], autoPlay);
    }
  }, [episodes, selectedEpisode, saveWatchHistory, handleEpisodeSelect, autoPlay]);

  const handlePrev = useCallback(() => {
    if (!episodes || !selectedEpisode) return;
    const idx = episodes.findIndex(e => e.id === selectedEpisode.id);
    if (idx > 0) handleEpisodeSelect(episodes[idx - 1]);
  }, [episodes, selectedEpisode, handleEpisodeSelect]);

  const handlePiP = useCallback(async () => {
    toast({
      title: 'Picture-in-Picture',
      description: 'PiP is controlled by the embedded player. Use the player controls to enable PiP if supported.',
    });
  }, [toast]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key.toLowerCase() === 'f') setIsTheaterMode(prev => !prev);
      if (e.key.toLowerCase() === 'p') handlePiP();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNext, handlePrev, handlePiP]);

  const isLoading = isLoadingAnime || isLoadingEpisodes;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading anime experience...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background/95 to-background/90">
      <Navbar />

      <div className={`flex-1 container mx-auto px-4 py-6 space-y-6 ${isTheaterMode ? 'max-w-screen-2xl' : 'max-w-7xl'}`}>
        {/* VIDEO PLAYER SECTION */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl shadow-2xl">
            <div 
              className={`relative group rounded-xl overflow-hidden bg-black ${
                isTheaterMode ? 'shadow-none' : 'shadow-2xl'
              }`}
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              {/* Loading Overlay */}
              {isLoadingEmbed && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-white/80">Loading player...</p>
                  </div>
                </div>
              )}

              {/* Video Player */}
              {selectedEpisode ? (
                <div className="aspect-video">
                  <iframe
                    src={getEmbedUrl(selectedEpisode)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={`Episode ${selectedEpisode.episode_number}`}
                    onLoad={() => setIsLoadingEmbed(false)}
                  />
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Play className="h-16 w-16 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-lg">Select an episode to start watching</p>
                  </div>
                </div>
              )}

              {/* Floating Controls */}
              {showControls && selectedEpisode && (
                <div className="absolute top-4 right-4 flex items-center gap-2 animate-in fade-in duration-300">
                  <Badge className="bg-black/60 text-white backdrop-blur-sm">
                    S{selectedEpisode.season_number}E{selectedEpisode.episode_number}
                  </Badge>
                  <Badge className="bg-black/60 text-white backdrop-blur-sm">
                    Press F for theater
                  </Badge>
                </div>
              )}
            </div>

            {/* Player Controls */}
            <CardContent className="p-6 space-y-4">
              {/* Episode Info */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {anime?.title}
                  </h1>
                  {selectedEpisode && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className="bg-primary/20 text-primary border-primary/20">
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

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={!episodes || episodes[0]?.id === selectedEpisode?.id}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={!episodes || episodes[episodes.length - 1]?.id === selectedEpisode?.id}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsTheaterMode(v => !v)}
                    className="gap-2"
                  >
                    {isTheaterMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    {isTheaterMode ? 'Exit' : 'Theater'}
                  </Button>
                </div>
              </div>

              {/* Server Selection */}
              {servers.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    Server:
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {servers.map(server => {
                      const hasUrl = !!selectedEpisode?.server_urls?.[server.id];
                      return (
                        <Button
                          key={server.id}
                          size="sm"
                          variant={selectedServer === server.id ? "default" : "outline"}
                          onClick={() => {
                            if (hasUrl) {
                              setSelectedServer(server.id);
                              setIsLoadingEmbed(true);
                              toast({
                                title: "Server changed",
                                description: `Now using ${server.name}`,
                              });
                            }
                          }}
                          disabled={!hasUrl}
                          className={`relative ${
                            !hasUrl ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {server.name}
                          {selectedServer === server.id && (
                            <Sparkles className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPlay}
                      onChange={(e) => setAutoPlay(e.target.checked)}
                      className="rounded border-border"
                    />
                    Autoplay
                  </label>
                  
                  <Button size="sm" variant="ghost" onClick={handlePiP} className="gap-2">
                    <PictureInPicture2 className="h-4 w-4" />
                    PiP
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Episode Description */}
              {selectedEpisode?.title && (
                <div className="pt-4 border-t border-border/40">
                  <h3 className="font-semibold text-lg mb-2">{selectedEpisode.title}</h3>
                  {selectedEpisode.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedEpisode.description}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* EPISODE BROWSER */}
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

              <div className="flex items-center gap-4">
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <Select value={episodeRange.toString()} onValueChange={(v) => setEpisodeRange(parseInt(v))}>
                    <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm">
                      <SelectValue placeholder="Page" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-sm">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          Episodes {i * episodesPerPage + 1}–{Math.min((i + 1) * episodesPerPage, seasonEpisodes.length)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Episode Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
              {displayedEpisodes.map((ep) => {
                const isCurrent = selectedEpisode?.id === ep.id;
                const isWatched = watchProgress >= 90 && isCurrent;
                
                return (
                  <Button
                    key={ep.id}
                    variant={isCurrent ? "default" : "outline"}
                    className={`
                      h-14 relative group transition-all duration-300 border-2
                      ${isCurrent 
                        ? "bg-gradient-to-br from-purple-600 to-pink-600 border-purple-500/50 shadow-lg shadow-purple-500/25 scale-105" 
                        : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/5"}
                      backdrop-blur-sm
                    `}
                    onClick={() => handleEpisodeSelect(ep)}
                  >
                    <div className="text-center space-y-1">
                      <div className="text-xs font-semibold leading-none">
                        {ep.episode_number}
                      </div>
                      {ep.duration && (
                        <div className="text-[10px] text-muted-foreground leading-none">
                          {ep.duration}m
                        </div>
                      )}
                    </div>
                    
                    {/* Watched Indicator */}
                    {isWatched && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background shadow-lg" />
                    )}
                    
                    {/* Hover Play Icon */}
                    {!isCurrent && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 rounded-md">
                        <Play className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ANIME DETAILS */}
        {anime && (
          <Card className="border-0 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex gap-6">
                {anime.cover_image && (
                  <img 
                    src={anime.cover_image} 
                    alt={anime.title}
                    className="w-32 h-48 object-cover rounded-xl shadow-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {anime.title}
                    </h2>
                    {anime.title_english && anime.title_english !== anime.title && (
                      <p className="text-lg text-muted-foreground mt-1">{anime.title_english}</p>
                    )}
                  </div>

                  {anime.description && (
                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {anime.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {anime.type && (
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20">
                        {anime.type}
                      </Badge>
                    )}
                    {anime.status && (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                        {anime.status}
                      </Badge>
                    )}
                    {anime.rating && (
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">
                        ⭐ {anime.rating}/10
                      </Badge>
                    )}
                    {anime.release_year && (
                      <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/20">
                        <Calendar className="h-3 w-3 mr-1" />
                        {anime.release_year}
                      </Badge>
                    )}
                    {anime.genres?.slice(0, 4).map(genre => (
                      <Badge key={genre} variant="outline" className="bg-background/50">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* COMMENTS SECTION */}
        {anime?.id && (
          <Card className="border-0 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Comments & Discussion</h2>
                  <p className="text-muted-foreground">Join the conversation</p>
                </div>
              </div>
              <Comments animeId={anime.id} />
            </CardContent>
          </Card>
        )}

        {/* RECOMMENDATIONS */}
        {recommendedAnime.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <SkipForward className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  You Might Also Like
                </h2>
                <p className="text-muted-foreground">Based on your watching history</p>
              </div>
            </div>
            <AnimeSection title="" animes={recommendedAnime} layout="scroll" />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
