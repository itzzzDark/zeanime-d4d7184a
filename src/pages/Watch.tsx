import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, ChevronLeft, ChevronRight, Server, Maximize, SkipForward, PictureInPicture2, FastForward, MessageSquare } from 'lucide-react';
import { AnimeSection } from '@/components/AnimeSection';
import { Comments } from '@/components/Comments';
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

  // Fetch available servers
  const { data: servers } = useQuery({
    queryKey: ['embed_servers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embed_servers')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      if (error) throw error;
      return data as EmbedServer[];
    },
  });

  // Fetch anime by slug or ID
  const { data: anime } = useQuery({
    queryKey: ['anime', animeSlugOrId],
    queryFn: async () => {
      // Try slug first
      let { data, error } = await supabase.from('anime').select('*').eq('slug', animeSlugOrId).maybeSingle();
      
      // Fallback to ID if slug doesn't match
      if (!data && !error) {
        const result = await supabase.from('anime').select('*').eq('id', animeSlugOrId).maybeSingle();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      return data as Anime;
    },
    enabled: !!animeSlugOrId,
  });

  // Fetch episodes
  const { data: episodes, isLoading } = useQuery({
    queryKey: ['episodes', anime?.slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('anime_slug', anime.slug)
        .order('season_number')
        .order('episode_number');
      if (error) throw error;
      return data as Episode[];
    },
    enabled: !!anime?.slug,
  });

  // Recommendations
  const { data: recommendedAnime } = useQuery({
    queryKey: ['recommended', anime?.genres],
    queryFn: async () => {
      if (!anime?.genres?.length) return [];
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .neq('id', anime.id)
        .limit(12);
      if (error) throw error;
      return data;
    },
    enabled: !!anime?.genres,
  });

  const seasons = useMemo(() => [...new Set(episodes?.map(e => e.season_number) || [])].sort(), [episodes]);
  const seasonEpisodes = useMemo(() => episodes?.filter(e => e.season_number === selectedSeason) || [], [episodes, selectedSeason]);
  const episodesPerPage = 100;
  const totalPages = Math.ceil(seasonEpisodes.length / episodesPerPage);
  const displayedEpisodes = seasonEpisodes.slice(episodeRange * episodesPerPage, (episodeRange + 1) * episodesPerPage);

  // Get embed URL
  const getEmbedUrl = useCallback(
    (episode: Episode) => {
      if (!episode) return '';
      
      // If a server is selected and episode has server URLs, construct full URL
      if (selectedServer && episode.server_urls?.[selectedServer]) {
        const server = servers?.find(s => s.id === selectedServer);
        const episodeSlug = episode.server_urls[selectedServer];
        if (server && episodeSlug) {
          return `${server.embed_url}${episodeSlug}`;
        }
      }
      
      // Fallback to video_url
      return episode.video_url || '';
    },
    [selectedServer, servers]
  );

  // Set default server when servers load
  useEffect(() => {
    if (servers && servers.length > 0 && !selectedServer) {
      setSelectedServer(servers[0].id);
    }
  }, [servers, selectedServer]);

  // Load episode
  useEffect(() => {
    if (episodeId && episodes) {
      const ep = episodes.find(e => e.id === episodeId);
      if (ep) {
        setSelectedEpisode(ep);
        setSelectedSeason(ep.season_number);
      }
    } else if (episodes && episodes.length > 0 && !selectedEpisode) {
      setSelectedEpisode(episodes[0]);
    }
  }, [episodeId, episodes, selectedEpisode]);

  // Load watch progress
  useEffect(() => {
    if (!selectedEpisode) return;
    const loadProgress = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      
      const { data: history } = await supabase
        .from('watch_history')
        .select('progress')
        .eq('user_id', data.user.id)
        .eq('episode_id', selectedEpisode.id)
        .maybeSingle();
      
      if (history) setWatchProgress(history.progress || 0);
    };
    loadProgress();
  }, [selectedEpisode]);

  // Watch history with progress
  const saveWatchHistory = useCallback(
    async (episode: Episode, progress = 0) => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user || !anime?.id) return;
      await supabase.from('watch_history').upsert({
        user_id: authData.user.id,
        anime_id: anime.id,
        episode_id: episode.id,
        progress,
        last_watched: new Date().toISOString(),
        completed: progress >= 90,
      });
    },
    [anime?.id]
  );

  const handleEpisodeSelect = (episode: Episode, showToast = true) => {
    setSelectedEpisode(episode);
    navigate(`/watch/${anime?.slug || anime?.id}/${episode.id}`);
    saveWatchHistory(episode, 0);
    if (showToast) {
      toast({
        title: 'Now Watching',
        description: `Episode ${episode.episode_number}`,
      });
    }
  };

  const handleNext = () => {
    if (!episodes || !selectedEpisode) return;
    const idx = episodes.findIndex(e => e.id === selectedEpisode.id);
    if (idx < episodes.length - 1) {
      saveWatchHistory(selectedEpisode, 100);
      handleEpisodeSelect(episodes[idx + 1], autoPlay);
    }
  };

  const handlePrev = () => {
    if (!episodes || !selectedEpisode) return;
    const idx = episodes.findIndex(e => e.id === selectedEpisode.id);
    if (idx > 0) handleEpisodeSelect(episodes[idx - 1]);
  };

  // Picture in Picture
  const handlePiP = async () => {
    const iframe = document.querySelector('iframe');
    if (!iframe) return;
    
    try {
      // @ts-ignore
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        toast({
          title: 'Picture-in-Picture',
          description: 'PiP mode is controlled by the video player. Look for the PiP button in the player controls.',
        });
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  // Keyboard control
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key.toLowerCase() === 'f') setIsTheaterMode(prev => !prev);
      if (e.key.toLowerCase() === 'p') handlePiP();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedEpisode, isTheaterMode]);

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background/95 to-background">
      <Navbar />
      <div className={`container mx-auto px-4 py-8 space-y-6 ${isTheaterMode ? 'max-w-full px-2' : ''}`}>
        <Card className="overflow-hidden border-border/30 bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl shadow-card">
          <div className="aspect-video bg-black relative group">
            {selectedEpisode ? (
              <>
                <iframe
                  src={getEmbedUrl(selectedEpisode)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={`Episode ${selectedEpisode.episode_number}`}
                />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="secondary" className="bg-black/80 text-white">
                    Press F for theater mode
                  </Badge>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white">Select an episode to watch</p>
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="p-6 space-y-4 bg-gradient-to-b from-card/90 via-card/80 to-card/70 backdrop-blur-md border-t border-border/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{anime?.title}</h2>
                {selectedEpisode && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      S{selectedEpisode.season_number} • E{selectedEpisode.episode_number}
                    </Badge>
                    {selectedEpisode.duration && (
                      <Badge variant="outline">{selectedEpisode.duration}m</Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePrev} disabled={!episodes || episodes[0]?.id === selectedEpisode?.id}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button size="sm" variant="outline" onClick={handleNext} disabled={!episodes || episodes[episodes.length - 1]?.id === selectedEpisode?.id}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsTheaterMode(v => !v)}>
                  <Maximize className="h-4 w-4 mr-1" /> {isTheaterMode ? 'Normal' : 'Theater'}
                </Button>
                <Button size="sm" variant="outline" onClick={handlePiP} title="Picture-in-Picture (P)">
                  <PictureInPicture2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4">
              {/* Server Buttons */}
              {servers && servers.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  {servers.map(server => (
                    <Button
                      key={server.id}
                      size="sm"
                      variant={selectedServer === server.id ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedServer(server.id);
                        toast({ title: 'Server changed', description: `Now using ${server.name}` });
                      }}
                    >
                      {server.name}
                    </Button>
                  ))}
                </div>
              )}

              {/* Settings & Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoplay"
                    checked={autoPlay}
                    onChange={(e) => setAutoPlay(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoplay" className="text-muted-foreground cursor-pointer">
                    Autoplay next episode
                  </label>
                </div>
                {watchProgress > 0 && (
                  <Badge variant="outline">
                    Progress: {watchProgress}%
                  </Badge>
                )}
                <div className="flex gap-2 ml-auto">
                  <Badge variant="secondary" className="gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Scroll down for comments
                  </Badge>
                </div>
              </div>

              {/* Episode Info */}
              {selectedEpisode?.title && (
                <div className="pt-2 border-t border-border/50">
                  <h4 className="font-semibold text-lg mb-1">{selectedEpisode.title}</h4>
                  {selectedEpisode.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2">{selectedEpisode.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Episode list */}
        <Card className="p-6 border-border/30 bg-gradient-to-br from-card/70 via-card/50 to-card/70 backdrop-blur-xl shadow-card">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" /> Episodes
          </h3>
          <Tabs value={selectedSeason.toString()} onValueChange={v => setSelectedSeason(parseInt(v))}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <TabsList>
                {seasons.map(season => (
                  <TabsTrigger key={season} value={season.toString()}>
                    Season {season}
                  </TabsTrigger>
                ))}
              </TabsList>

              {totalPages > 1 && (
                <Select value={episodeRange.toString()} onValueChange={v => setEpisodeRange(parseInt(v))}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Page" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i * episodesPerPage + 1}–{Math.min((i + 1) * episodesPerPage, seasonEpisodes.length)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {seasons.map(season => (
              <TabsContent key={season} value={season.toString()}>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                  {displayedEpisodes.map(ep => {
                    const isWatched = watchProgress >= 90 && ep.id === selectedEpisode?.id;
                    return (
                      <Button
                        key={ep.id}
                        variant={selectedEpisode?.id === ep.id ? 'default' : 'outline'}
                        className="h-12 relative group"
                        onClick={() => handleEpisodeSelect(ep)}
                        title={ep.title || `Episode ${ep.episode_number}`}
                      >
                        {ep.episode_number}
                        {isWatched && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>

        {/* Anime Info */}
        {anime && (
          <Card className="p-6 border-border/30 bg-gradient-to-br from-card/70 via-card/50 to-card/70 backdrop-blur-xl shadow-card animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4">
              {anime.cover_image && (
                <img
                  src={anime.cover_image}
                  alt={anime.title}
                  className="w-full md:w-32 h-auto md:h-48 object-cover rounded-lg hover-lift"
                />
              )}
              <div className="flex-1 space-y-3">
                <h3 className="text-xl font-bold">{anime.title}</h3>
                {anime.description && <p className="text-muted-foreground line-clamp-3">{anime.description}</p>}
                <div className="flex gap-2 flex-wrap">
                  {anime.type && <Badge variant="secondary">{anime.type}</Badge>}
                  {anime.status && <Badge variant="outline">{anime.status}</Badge>}
                  {anime.rating && <Badge variant="outline">⭐ {anime.rating}/10</Badge>}
                  {anime.genres?.slice(0, 4).map(g => (
                    <Badge key={g} variant="outline">
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Comments */}
        {anime?.id && (
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <Comments animeId={anime.id} />
          </Card>
        )}

        {/* Recommended */}
        {recommendedAnime && recommendedAnime.length > 0 && (
          <div className="animate-fade-in space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <SkipForward className="h-6 w-6 text-primary" /> You Might Also Like
            </h2>
            <AnimeSection title="" animes={recommendedAnime} layout="scroll" />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
