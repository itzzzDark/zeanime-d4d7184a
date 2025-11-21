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
  MessageSquare,
  Clock,
  Calendar,
  Sparkles,
  ArrowLeft,
  Grid3X3,
  List,
  MonitorPlay,
  Zap,
  CheckCircle,
  Star,
  Users,
  Eye
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
  popularity?: number;
  favorites?: number;
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

  // Fast parallel data fetching
  const { data: animeData, isLoading: isLoadingAnime } = useQuery({
    queryKey: ['anime-watch', animeSlugOrId],
    queryFn: async () => {
      if (!animeSlugOrId) return null;
      
      const [slugData, idData] = await Promise.all([
        supabase.from('anime').select('*').eq('slug', animeSlugOrId).maybeSingle(),
        supabase.from('anime').select('*').eq('id', animeSlugOrId).maybeSingle()
      ]);
      
      return (slugData.data || idData.data) as Anime | null;
    },
    enabled: !!animeSlugOrId,
  });

  const { data: episodesData, isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ['episodes-watch', animeData?.id],
    queryFn: async () => {
      if (!animeData?.id) return [] as Episode[];
      
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('anime_id', animeData.id)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Episode[];
    },
    enabled: !!animeData?.id,
  });

  const { data: servers = [] } = useQuery({
    queryKey: ['embed_servers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embed_servers')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .limit(6);
      
      if (error) throw error;
      
      return (data || []).map(server => ({
        ...server,
        latency: Math.floor(Math.random() * 100) + 20,
        quality: ['1080p', '720p', '480p']
      })) as EmbedServer[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: recommendedAnime = [] } = useQuery({
    queryKey: ['recommended-watch', animeData?.genres],
    queryFn: async () => {
      if (!animeData?.genres?.length) return [];
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .neq('id', animeData?.id)
        .limit(6);
      if (error) throw error;
      return data || [];
    },
    enabled: !!animeData?.genres,
  });

  // Memoized data
  const seasons = useMemo(() => {
    return [...new Set((episodesData || []).map(e => e.season_number))].sort((a, b) => a - b);
  }, [episodesData]);

  const seasonEpisodes = useMemo(() => {
    return (episodesData || []).filter(e => e.season_number === selectedSeason);
  }, [episodesData, selectedSeason]);

  const episodesPerPage = episodeViewMode === 'detailed' ? 8 : episodeViewMode === 'list' ? 12 : 24;
  const totalPages = Math.max(1, Math.ceil(seasonEpisodes.length / episodesPerPage));
  const displayedEpisodes = seasonEpisodes.slice(episodeRange * episodesPerPage, (episodeRange + 1) * episodesPerPage);

  // Fast episode selection
  useEffect(() => {
    if (episodeId && episodesData?.length) {
      const ep = episodesData.find(e => e.id === episodeId);
      if (ep) {
        setSelectedEpisode(ep);
        setSelectedSeason(ep.season_number);
        setIsPlayerReady(true);
        return;
      }
    }
    
    if (!selectedEpisode && episodesData?.length && !episodeId) {
      const firstEpisode = episodesData[0];
      setSelectedEpisode(firstEpisode);
      setSelectedSeason(firstEpisode.season_number);
      setIsPlayerReady(true);
      navigate(`/watch/${animeData?.slug || animeData?.id}/${firstEpisode.id}`, { replace: true });
    }
  }, [episodeId, episodesData, selectedEpisode, animeData?.slug, animeData?.id, navigate]);

  const getEmbedUrl = useCallback((episode?: Episode) => {
    if (!episode) return '';
    
    if (selectedServer && episode.server_urls?.[selectedServer]) {
      const server = servers.find(s => s.id === selectedServer);
      return server ? `${server.embed_url}${episode.server_urls[selectedServer]}` : '';
    }
    
    for (const server of servers) {
      if (episode.server_urls?.[server.id]) {
        return `${server.embed_url}${episode.server_urls[server.id]}`;
      }
    }
    
    return episode.video_url || '';
  }, [selectedServer, servers]);

  const handleEpisodeSelect = useCallback((episode: Episode) => {
    setSelectedEpisode(episode);
    setSelectedSeason(episode.season_number);
    setIsLoadingEmbed(true);
    setIsPlayerReady(true);
    
    navigate(`/watch/${animeData?.slug || animeData?.id}/${episode.id}`);
  }, [animeData?.slug, animeData?.id, navigate]);

  const handleNext = useCallback(() => {
    if (!episodesData || !selectedEpisode) return;
    const idx = episodesData.findIndex(e => e.id === selectedEpisode.id);
    if (idx < episodesData.length - 1) {
      handleEpisodeSelect(episodesData[idx + 1]);
    }
  }, [episodesData, selectedEpisode, handleEpisodeSelect]);

  const handlePrev = useCallback(() => {
    if (!episodesData || !selectedEpisode) return;
    const idx = episodesData.findIndex(e => e.id === selectedEpisode.id);
    if (idx > 0) handleEpisodeSelect(episodesData[idx - 1]);
  }, [episodesData, selectedEpisode, handleEpisodeSelect]);

  const handleBackToAnime = useCallback(() => {
    if (animeData?.slug) {
      navigate(`/anime/${animeData.slug}`);
    } else {
      navigate(-1);
    }
  }, [animeData?.slug, navigate]);

  const handlePlayerLoad = useCallback(() => {
    setIsLoadingEmbed(false);
  }, []);

  const isLoading = isLoadingAnime || isLoadingEpisodes;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-4 space-y-4 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToAnime}
          className="gap-1.5 text-muted-foreground hover:text-foreground transition-colors -ml-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="text-sm">Back to Anime</span>
        </Button>

        {/* Video Player */}
        <Card className="overflow-hidden border bg-card">
          <div className="relative aspect-video bg-black">
            {isLoadingEmbed && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                <div className="text-center space-y-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                  <p className="text-white/80 text-xs">Loading player...</p>
                </div>
              </div>
            )}

            {isPlayerReady && selectedEpisode ? (
              <iframe
                src={getEmbedUrl(selectedEpisode)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={`Episode ${selectedEpisode.episode_number}`}
                onLoad={handlePlayerLoad}
                key={`${selectedEpisode.id}-${selectedServer}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <Play className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground text-sm">Select an episode</p>
                </div>
              </div>
            )}
          </div>

          <CardContent className="p-4 space-y-3">
            {/* Episode Info */}
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1 min-w-0">
                <h1 className="text-lg font-semibold truncate">{animeData?.title}</h1>
                {selectedEpisode && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      S{selectedEpisode.season_number}E{selectedEpisode.episode_number}
                    </Badge>
                    {selectedEpisode.title && (
                      <span className="text-sm text-muted-foreground truncate">
                        {selectedEpisode.title}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={!episodesData || episodesData[0]?.id === selectedEpisode?.id}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={!episodesData || episodesData[episodesData.length - 1]?.id === selectedEpisode?.id}
                  className="h-8 px-2 bg-primary hover:bg-primary/90"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Server Selection */}
            {servers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Server className="h-3.5 w-3.5" />
                  <span>Servers</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {servers.map(server => {
                    const hasUrl = !!selectedEpisode?.server_urls?.[server.id];
                    const isSelected = selectedServer === server.id;
                    
                    return (
                      <Button
                        key={server.id}
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => {
                          if (hasUrl) {
                            setSelectedServer(server.id);
                            setIsLoadingEmbed(true);
                          }
                        }}
                        disabled={!hasUrl}
                        className={`
                          h-7 px-2 text-xs relative
                          ${!hasUrl ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        <span className="flex items-center gap-1">
                          {server.name}
                          {isSelected && <CheckCircle className="h-3 w-3" />}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Auto-play Toggle */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={autoPlay}
                    onChange={(e) => setAutoPlay(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`
                    w-8 h-4 rounded-full transition-all duration-200 border
                    ${autoPlay ? 'bg-primary border-primary' : 'bg-muted border-border'}
                  `}>
                    <div className={`
                      absolute top-0.5 w-3 h-3 bg-background rounded-full transition-all duration-200
                      ${autoPlay ? 'left-4' : 'left-0.5'}
                    `} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className={`h-3.5 w-3.5 ${autoPlay ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${autoPlay ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Auto-play
                  </span>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Episode Browser */}
        <Card className="border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Episodes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Season {selectedSeason} • {seasonEpisodes.length} episodes
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
                  {[['grid', Grid3X3], ['list', List], ['detailed', MonitorPlay]].map(([mode, Icon]) => (
                    <Button
                      key={mode}
                      size="sm"
                      variant={episodeViewMode === mode ? "default" : "ghost"}
                      onClick={() => setEpisodeViewMode(mode as any)}
                      className="h-7 w-7 p-0"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </Button>
                  ))}
                </div>

                {seasons.length > 1 && (
                  <Select value={selectedSeason.toString()} onValueChange={(v) => setSelectedSeason(parseInt(v))}>
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((season) => (
                        <SelectItem key={season} value={season.toString()} className="text-xs">
                          Season {season}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className={`
              gap-1.5
              ${episodeViewMode === 'detailed' 
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
                : episodeViewMode === 'list'
                ? 'grid grid-cols-1'
                : 'grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12'
              }
            `}>
              {displayedEpisodes.map((ep) => (
                <EpisodeCard
                  key={ep.id}
                  episode={ep}
                  isCurrent={selectedEpisode?.id === ep.id}
                  viewMode={episodeViewMode}
                  onSelect={handleEpisodeSelect}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Select value={episodeRange.toString()} onValueChange={(v) => setEpisodeRange(parseInt(v))}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <SelectItem key={i} value={i.toString()} className="text-xs">
                        Episodes {i * episodesPerPage + 1}–{Math.min((i + 1) * episodesPerPage, seasonEpisodes.length)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modern Anime Details */}
        {animeData && (
          <Card className="border bg-card">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {animeData.cover_image && (
                  <img 
                    src={animeData.cover_image} 
                    alt={animeData.title}
                    className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold truncate">{animeData.title}</h2>
                    {animeData.title_english && animeData.title_english !== animeData.title && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{animeData.title_english}</p>
                    )}
                  </div>

                  {animeData.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {animeData.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {animeData.rating || 'N/A'}/10
                    </Badge>
                    {animeData.type && (
                      <Badge variant="outline" className="text-xs">
                        {animeData.type}
                      </Badge>
                    )}
                    {animeData.status && (
                      <Badge variant="outline" className="text-xs">
                        {animeData.status}
                      </Badge>
                    )}
                    {animeData.release_year && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {animeData.release_year}
                      </Badge>
                    )}
                    {animeData.popularity && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {animeData.popularity}K
                      </Badge>
                    )}
                  </div>

                  {animeData.genres && (
                    <div className="flex flex-wrap gap-1">
                      {animeData.genres.slice(0, 4).map(genre => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modern Comments Section */}
        {animeData?.id && (
          <Card className="border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Discussion</h3>
                  <p className="text-xs text-muted-foreground">Join the conversation</p>
                </div>
              </div>
              <Comments animeId={animeData.id} />
            </CardContent>
          </Card>
        )}

        {/* Modern Recommendations */}
        {recommendedAnime.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-purple-500/10">
                <Users className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">You May Also Like</h3>
                <p className="text-xs text-muted-foreground">Similar anime you might enjoy</p>
              </div>
            </div>
            <AnimeSection 
              title="" 
              animes={recommendedAnime} 
              layout="scroll"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// Optimized Episode Card
const EpisodeCard = ({ 
  episode, 
  isCurrent, 
  viewMode, 
  onSelect 
}: { 
  episode: Episode;
  isCurrent: boolean;
  viewMode: string;
  onSelect: (ep: Episode) => void;
}) => {
  if (viewMode === 'detailed') {
    return (
      <Card
        className={`
          cursor-pointer transition-all duration-150 border
          ${isCurrent 
            ? "bg-primary text-primary-foreground border-primary shadow-md" 
            : "bg-card hover:bg-accent border-border"}
        `}
        onClick={() => onSelect(episode)}
      >
        <CardContent className="p-2">
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
                <Play className="h-3 w-3" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium">Ep {episode.episode_number}</span>
                {episode.duration && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-1">
                    {episode.duration}m
                  </span>
                )}
              </div>
              {episode.title && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
                  {episode.title}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'list') {
    return (
      <div
        className={`
          flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-all duration-150
          ${isCurrent 
            ? "bg-primary text-primary-foreground border-primary shadow-sm" 
            : "bg-card hover:bg-accent border-border"}
        `}
        onClick={() => onSelect(episode)}
      >
        <div className={`
          w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-xs font-medium
          ${isCurrent ? 'bg-primary-foreground text-primary' : 'bg-muted'}
        `}>
          {episode.episode_number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {episode.title || `Episode ${episode.episode_number}`}
          </p>
          {episode.duration && (
            <p className="text-xs text-muted-foreground mt-0.5">{episode.duration}m</p>
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <Button
      variant={isCurrent ? "default" : "outline"}
      size="sm"
      className={`
        h-8 w-8 p-0 text-xs font-medium transition-all duration-150
        ${isCurrent ? "shadow-md scale-105" : ""}
      `}
      onClick={() => onSelect(episode)}
    >
      {episode.episode_number}
    </Button>
  );
};
