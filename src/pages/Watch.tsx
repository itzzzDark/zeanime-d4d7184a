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
import {
  Loader2,
  Play,
  ChevronLeft,
  ChevronRight,
  Server,
  Maximize,
  SkipForward,
  PictureInPicture2,
  MessageSquare
} from 'lucide-react';
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
  embed_url: string; // base embed url, e.g. https://streamsb.com/e/
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

  // ---- Supabase queries (safe defaults) ----
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

  const { data: anime } = useQuery({
    queryKey: ['anime', animeSlugOrId],
    queryFn: async () => {
      if (!animeSlugOrId) return null;
      // try slug first
      const { data, error } = await supabase.from('anime').select('*').eq('slug', animeSlugOrId).maybeSingle();
      if (error) throw error;
      if (data) return data as Anime;
      // fallback to id
      const res = await supabase.from('anime').select('*').eq('id', animeSlugOrId).maybeSingle();
      if (res.error) throw res.error;
      return res.data as Anime | null;
    },
    enabled: !!animeSlugOrId,
  });

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ['episodes', anime?.slug ?? anime?.id],
    queryFn: async () => {
      if (!anime?.slug && !anime?.id) return [] as Episode[];
      // prefer slug but fallback to anime.id if slug missing
      const key = anime?.slug ?? anime?.id;
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        // try matching by anime_slug if available, otherwise try anime_id
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
      // very simple recommendations: same genres, exclude current anime
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

  // ---- derived lists ----
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

  // ---- choose a sensible server when episode changes (no state in render) ----
  useEffect(() => {
    if (!selectedEpisode) return;
    // prefer current selectedServer if episode has it
    if (selectedServer && selectedEpisode.server_urls?.[selectedServer]) return;
    // else pick first compatible server from episode.server_urls that exists in servers list
    if (selectedEpisode.server_urls) {
      const keys = Object.keys(selectedEpisode.server_urls);
      for (const id of keys) {
        if (servers.find(s => s.id === id)) {
          setSelectedServer(id);
          return;
        }
      }
    }
    // last fallback: pick first active server globally
    if (servers.length > 0) {
      setSelectedServer(prev => prev || servers[0].id);
    }
  }, [selectedEpisode, servers, selectedServer]);

  // ---- safe embed URL (no state set here) ----
  const getEmbedUrl = useCallback(
    (episode?: Episode) => {
      if (!episode) return '';
      // try selectedServer first
      if (selectedServer && episode.server_urls?.[selectedServer]) {
        const server = servers.find(s => s.id === selectedServer);
        if (server) return `${server.embed_url}${episode.server_urls[selectedServer]}`;
      }
      // try any server available on episode
      if (episode.server_urls) {
        for (const sid of Object.keys(episode.server_urls)) {
          const server = servers.find(s => s.id === sid);
          if (server && episode.server_urls[sid]) {
            return `${server.embed_url}${episode.server_urls[sid]}`;
          }
        }
      }
      // fallback to direct video_url
      return episode.video_url || '';
    },
    [selectedServer, servers]
  );

  // ---- default server on servers load ----
  useEffect(() => {
    if (!selectedServer && servers.length > 0) {
      setSelectedServer(servers[0].id);
    }
  }, [servers, selectedServer]);

  // ---- select episode logic ----
  useEffect(() => {
    // if route contains episodeId, pick it
    if (episodeId && episodes.length > 0) {
      const ep = episodes.find(e => e.id === episodeId);
      if (ep) {
        setSelectedEpisode(ep);
        setSelectedSeason(ep.season_number);
        return;
      }
    }
    // otherwise default to first episode if none selected
    if (!selectedEpisode && episodes.length > 0) {
      setSelectedEpisode(episodes[0]);
      setSelectedSeason(episodes[0].season_number);
    }
  }, [episodeId, episodes, selectedEpisode]);

  // ---- load watch progress for selectedEpisode ----
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

  // ---- save watch history helper ----
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
        // ignore silently
        console.warn('watch_history upsert failed', err);
      }
    },
    [anime?.id]
  );

  const handleEpisodeSelect = useCallback(
    (episode: Episode, showToast = true) => {
      setSelectedEpisode(episode);
      setSelectedSeason(episode.season_number);
      navigate(`/watch/${anime?.slug || anime?.id}/${episode.id}`);
      saveWatchHistory(episode, 0);
      if (showToast) {
        toast({
          title: 'Now Watching',
          description: `Episode ${episode.episode_number}`,
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

  // Picture in Picture: iframe-based players often cannot be controlled from outer doc.
  const handlePiP = useCallback(async () => {
    // For many embed players, PiP is provided by the player UI inside iframe.
    toast({
      title: 'Picture-in-Picture',
      description: 'PiP is controlled by the embedded player. Use the player controls to enable PiP if supported.',
    });
  }, [toast]);

  // keyboard controls
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

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-black">
        <Loader2 className="h-10 w-10 animate-spin text-primary glow-purple" />
      </div>
    );

  // ---- UI ----
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background/95 to-black text-foreground">
      <Navbar />

      <div className={`container mx-auto px-4 py-8 space-y-6 ${isTheaterMode ? 'max-w-screen-2xl' : 'max-w-7xl'}`}>
        {/* VIDEO + PLAYER */}
        <Card className={`overflow-hidden border-primary/20 ${isTheaterMode ? 'bg-black/90' : 'bg-card/90'} backdrop-blur-xl shadow-2xl shadow-primary/10`}>
          <div className={`aspect-video relative group rounded-lg overflow-hidden bg-black ${isTheaterMode ? 'shadow-none' : 'shadow-2xl shadow-primary/20'}`}>
            {selectedEpisode ? (
              <>
                {/* embed iframe */}
                <iframe
                  src={getEmbedUrl(selectedEpisode)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={`Episode ${selectedEpisode.episode_number}`}
                />

                {/* small purple hint badge */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge className="bg-black/60 text-white px-2 py-0.5 text-xs">
                    Press F for theater
                  </Badge>
                </div>

                {/* centered play hint on mobile (subtle, appears on hover / tap) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="opacity-0 group-hover:opacity-80 transition-opacity duration-300 transform group-hover:scale-100">
                    {/* layered subtle glow */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs rounded-full shadow-lg">
                      <Play className="h-4 w-4" />
                      <span>Watch Now</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select an episode to watch</p>
              </div>
            )}
          </div>

          {/* CONTROLS */}
          <div className="p-6 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-md border-t border-primary/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold truncate">{anime?.title}</h2>
                {selectedEpisode && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className="bg-white/5 text-white/90 px-2 py-0.5">S{selectedEpisode.season_number} • E{selectedEpisode.episode_number}</Badge>
                    {selectedEpisode.duration && <Badge className="bg-white/5 text-white/80 px-2 py-0.5">{selectedEpisode.duration}m</Badge>}
                    {anime?.rating && <Badge className="bg-white/5 text-white/80 px-2 py-0.5">⭐ {anime.rating}/10</Badge>}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handlePrev} disabled={!episodes || episodes[0]?.id === selectedEpisode?.id}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>

                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:brightness-105" onClick={handleNext} disabled={!episodes || episodes[episodes.length - 1]?.id === selectedEpisode?.id}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                <Button size="sm" variant="outline" onClick={() => setIsTheaterMode(v => !v)}>
                  <Maximize className="h-4 w-4 mr-1" /> {isTheaterMode ? 'Exit' : 'Theater'}
                </Button>

                <Button size="sm" variant="outline" onClick={handlePiP} title="Picture-in-Picture (P)">
                  <PictureInPicture2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* server buttons & settings */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              {servers.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  {servers.map(server => {
                    const hasUrl = !!selectedEpisode?.server_urls?.[server.id];
                    return (
                      <Button
                        key={server.id}
                        size="sm"
                        variant={selectedServer === server.id ? 'default' : 'outline'}
                        onClick={() => {
                          if (hasUrl) {
                            setSelectedServer(server.id);
                            toast({ title: 'Server changed', description: `Now using ${server.name}` });
                          } else {
                            toast({ title: 'Server unavailable', description: `${server.name} not available for this episode` });
                          }
                        }}
                        disabled={!hasUrl}
                        className={!hasUrl ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        {server.name}{!hasUrl && ' (N/A)'}
                      </Button>
                    );
                  })}
                </div>
              )}

              <div className="ml-auto flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} className="rounded" />
                  Autoplay
                </label>

                {watchProgress > 0 && <Badge className="bg-white/5 px-2 py-0.5">Progress: {watchProgress}%</Badge>}

                <Badge className="bg-white/5 px-2 py-0.5 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Comments below</Badge>
              </div>
            </div>

            {/* episode title/description */}
            {selectedEpisode?.title && (
              <div className="mt-4 border-t border-white/5 pt-3">
                <h3 className="font-semibold text-lg">{selectedEpisode.title}</h3>
                {selectedEpisode.description && <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{selectedEpisode.description}</p>}
              </div>
            )}
          </div>
        </Card>

        {/* EPISODE LIST */}
<Card className="p-5 bg-gradient-to-br from-[#0a0a12]/80 via-[#0f0f1a]/70 to-[#141421]/80 border border-white/10 rounded-xl shadow-md backdrop-blur-md">
  <div className="flex items-center justify-between mb-5">
    <h3 className="text-lg font-semibold flex items-center gap-2 text-white tracking-wide">
      <Play className="h-4 w-4 text-purple-400 animate-pulse" />
      Episodes
    </h3>

    <div className="flex items-center gap-3">
      {/* Season Tabs */}
      <Tabs value={selectedSeason.toString()} onValueChange={(v) => setSelectedSeason(parseInt(v))}>
        <TabsList className="bg-black/40 border border-white/10 rounded-lg flex gap-1 p-1">
          {seasons.map((season) => (
            <TabsTrigger
              key={season}
              value={season.toString()}
              className="px-2 py-1 text-xs text-gray-300 data-[state=active]:text-white data-[state=active]:bg-purple-600/80 rounded-md transition-all"
            >
              S{season}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <Select value={episodeRange.toString()} onValueChange={(v) => setEpisodeRange(parseInt(v))}>
          <SelectTrigger className="w-[160px] h-8 bg-black/40 border border-white/10 text-gray-300 text-xs">
            <SelectValue placeholder="Page" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f0f1a]/95 text-gray-200 border border-white/10 text-sm">
            {Array.from({ length: totalPages }, (_, i) => (
              <SelectItem
                key={i}
                value={i.toString()}
                className="hover:bg-purple-600/20 transition-colors"
              >
                {i * episodesPerPage + 1}–{Math.min((i + 1) * episodesPerPage, seasonEpisodes.length)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  </div>

  {/* Compact Episode Buttons */}
  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1.5">
    {displayedEpisodes.map((ep) => {
      const isCurrent = selectedEpisode?.id === ep.id;
      const watchedMarker = watchProgress >= 90 && isCurrent;
      return (
        <Button
          key={ep.id}
          variant={isCurrent ? 'default' : 'outline'}
          className={`
            h-8 text-xs relative font-medium rounded-md transition-all
            border border-white/10 backdrop-blur-sm
            ${isCurrent
              ? 'bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-sm shadow-purple-500/30 scale-105'
              : 'bg-black/40 text-gray-300 hover:bg-purple-500/20 hover:text-white'}
          `}
          onClick={() => handleEpisodeSelect(ep)}
          title={ep.title || `Episode ${ep.episode_number}`}
        >
          {ep.episode_number}
          {watchedMarker && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-black shadow shadow-green-400/40" />
          )}
        </Button>
      );
    })}
  </div>
</Card>
        {/* ANIME INFO */}
        {anime && (
          <Card className="p-6 bg-white/3 border border-white/5 backdrop-blur-sm">
            <div className="flex gap-4 items-start">
              {anime.cover_image && (
                <img src={anime.cover_image} alt={anime.title} className="w-32 h-48 object-cover rounded-lg" />
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{anime.title}</h3>
                {anime.description && <p className="text-muted-foreground line-clamp-4 mt-2">{anime.description}</p>}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {anime.type && <Badge className="bg-white/5">{anime.type}</Badge>}
                  {anime.status && <Badge className="bg-white/5">{anime.status}</Badge>}
                  {anime.rating && <Badge className="bg-white/5">⭐ {anime.rating}/10</Badge>}
                  {anime.genres?.slice(0, 6).map(g => <Badge key={g} className="bg-white/5">{g}</Badge>)}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* COMMENTS */}
        {anime?.id && (
          <Card className="p-6 bg-white/2 border border-white/5 backdrop-blur-sm">
            <Comments animeId={anime.id} />
          </Card>
        )}

        {/* RECOMMENDED */}
        {recommendedAnime && recommendedAnime.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <SkipForward className="h-6 w-6 text-violet-400" /> You Might Also Like
            </h2>
            <AnimeSection title="" animes={recommendedAnime} layout="scroll" />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
