import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, ChevronLeft, ChevronRight, Server, Maximize, SkipForward } from 'lucide-react';
import { AnimeSection } from '@/components/AnimeSection';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Episode {
  id: string;
  episode_number: number;
  season_number: number;
  title: string | null;
  description: string | null;
  video_url: string;
  thumbnail: string | null;
  duration: number | null;
}

interface Anime {
  id: string;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  description: string | null;
  cover_image: string | null;
  banner_image: string | null;
  genres: string[];
  type: string;
  status: string;
  rating: number | null;
  release_year: number | null;
}

// Multi-server configuration for embed players
const EMBED_SERVERS = [
  { id: "filemoon", name: "Filemoon", baseUrl: "https://filemoon.sx/e/" },
  { id: "abyss", name: "Abyss", baseUrl: "https://abyss.to/embed/" },
  { id: "vidstream", name: "Vidstream", baseUrl: "https://vidstream.to/embed/" },
  { id: "default", name: "Default", baseUrl: "" }
];

export default function Watch() {
  const { animeId, episodeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedServer, setSelectedServer] = useState('filemoon');
  const [episodeRange, setEpisodeRange] = useState(0);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Fetch anime details
  const { data: anime } = useQuery({
    queryKey: ['anime', animeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .eq('id', animeId)
        .single();
      if (error) throw error;
      return data as Anime;
    },
    enabled: !!animeId,
  });

  // Fetch all episodes for this anime
  const { data: episodes, isLoading } = useQuery({
    queryKey: ['episodes', animeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('anime_id', animeId)
        .order('season_number')
        .order('episode_number');
      if (error) throw error;
      return data as Episode[];
    },
    enabled: !!animeId,
  });

  // Fetch recommended anime (same genres)
  const { data: recommendedAnime } = useQuery({
    queryKey: ['recommended', anime?.genres],
    queryFn: async () => {
      if (!anime?.genres?.length) return [];
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .neq('id', animeId)
        .limit(12);
      if (error) throw error;
      return data;
    },
    enabled: !!anime?.genres,
  });

  // Get unique seasons
  const seasons = [...new Set(episodes?.map(e => e.season_number) || [])].sort();
  const seasonEpisodes = episodes?.filter(e => e.season_number === selectedSeason) || [];

  // Handle episodes over 100
  const episodesPerPage = 100;
  const totalPages = Math.ceil(seasonEpisodes.length / episodesPerPage);
  const displayedEpisodes = seasonEpisodes.slice(
    episodeRange * episodesPerPage,
    (episodeRange + 1) * episodesPerPage
  );

  // Get embed URL based on selected server
  const getEmbedUrl = (videoUrl: string) => {
    const server = EMBED_SERVERS.find(s => s.id === selectedServer);
    if (!server || server.id === "default") return videoUrl;
    
    // Extract video ID from URL or use as is
    const videoId = videoUrl.split('/').pop() || videoUrl;
    return `${server.baseUrl}${videoId}`;
  };

  useEffect(() => {
    if (episodeId && episodes) {
      const episode = episodes.find(e => e.id === episodeId);
      if (episode) {
        setSelectedEpisode(episode);
        setSelectedSeason(episode.season_number);
      }
    } else if (episodes && episodes.length > 0 && !selectedEpisode) {
      setSelectedEpisode(episodes[0]);
    }
  }, [episodeId, episodes, selectedEpisode]);

  const handleEpisodeSelect = (episode: Episode) => {
    setSelectedEpisode(episode);
    navigate(`/watch/${animeId}/${episode.id}`);
    
    // Track watch history (async, fire and forget)
    if (animeId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase
            .from('watch_history')
            .upsert({
              user_id: data.user.id,
              anime_id: animeId,
              episode_id: episode.id,
              progress: 0,
              last_watched: new Date().toISOString()
            })
            .then(() => {
              toast({
                title: "Progress saved",
                description: `Watching Episode ${episode.episode_number}`,
              });
            });
        }
      });
    }
  };

  const handleNextEpisode = () => {
    if (!episodes || !selectedEpisode) return;
    const currentIndex = episodes.findIndex(e => e.id === selectedEpisode.id);
    if (currentIndex < episodes.length - 1) {
      handleEpisodeSelect(episodes[currentIndex + 1]);
    }
  };

  const handlePrevEpisode = () => {
    if (!episodes || !selectedEpisode) return;
    const currentIndex = episodes.findIndex(e => e.id === selectedEpisode.id);
    if (currentIndex > 0) {
      handleEpisodeSelect(episodes[currentIndex - 1]);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextEpisode();
      if (e.key === 'ArrowLeft') handlePrevEpisode();
      if (e.key === 'f' || e.key === 'F') setIsTheaterMode(!isTheaterMode);
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedEpisode, isTheaterMode]);

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

      <div className={`container mx-auto px-4 py-8 space-y-6 ${isTheaterMode ? 'max-w-full' : ''}`}>
        {/* Video Player */}
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="aspect-video bg-black relative group">
            {selectedEpisode ? (
              <>
                <iframe
                  src={getEmbedUrl(selectedEpisode.video_url)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={`Episode ${selectedEpisode.episode_number}`}
                />
                {/* Overlay hint */}
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
          <div className="p-4 space-y-4 bg-gradient-to-b from-card to-card/95">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{anime?.title}</h2>
                {selectedEpisode && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      Season {selectedEpisode.season_number} • EP {selectedEpisode.episode_number}
                    </Badge>
                    {selectedEpisode.duration && (
                      <Badge variant="outline">{selectedEpisode.duration}m</Badge>
                    )}
                  </div>
                )}
                {selectedEpisode?.title && (
                  <p className="text-muted-foreground mt-1">{selectedEpisode.title}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevEpisode}
                  disabled={!episodes || !selectedEpisode || episodes[0].id === selectedEpisode.id}
                  className="hover-lift"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextEpisode}
                  disabled={!episodes || !selectedEpisode || episodes[episodes.length - 1].id === selectedEpisode.id}
                  className="hover-lift"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className="hover-lift"
                >
                  <Maximize className="h-4 w-4 mr-1" />
                  {isTheaterMode ? 'Normal' : 'Theater'}
                </Button>
              </div>
            </div>

            {/* Server Selection */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Server className="h-4 w-4" />
                Select Server:
              </span>
              <div className="flex gap-2 flex-wrap">
                {EMBED_SERVERS.map((server) => (
                  <Button
                    key={server.id}
                    variant={selectedServer === server.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedServer(server.id);
                      toast({
                        title: "Server changed",
                        description: `Now using ${server.name}`,
                      });
                    }}
                    className="hover-lift"
                  >
                    {server.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Episodes List */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Episodes
          </h3>
          <Tabs value={selectedSeason.toString()} onValueChange={(v) => {
            setSelectedSeason(parseInt(v));
            setEpisodeRange(0);
          }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <TabsList>
                {seasons.map((season) => (
                  <TabsTrigger key={season} value={season.toString()}>
                    Season {season}
                  </TabsTrigger>
                ))}
              </TabsList>

              {totalPages > 1 && (
                <Select value={episodeRange.toString()} onValueChange={(v) => setEpisodeRange(parseInt(v))}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        Episodes {i * episodesPerPage + 1}-{Math.min((i + 1) * episodesPerPage, seasonEpisodes.length)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {seasons.map((season) => (
              <TabsContent key={season} value={season.toString()}>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {displayedEpisodes.map((episode) => (
                    <Button
                      key={episode.id}
                      variant={selectedEpisode?.id === episode.id ? 'default' : 'outline'}
                      className="h-12 hover-lift"
                      onClick={() => handleEpisodeSelect(episode)}
                    >
                      {episode.episode_number}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>

        {/* Anime Info */}
        {anime && (
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4">
              {anime.cover_image && (
                <img
                  src={anime.cover_image}
                  alt={anime.title}
                  className="w-full md:w-32 h-auto md:h-48 object-cover rounded-lg hover-lift"
                />
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {anime.title}
                  </h3>
                  {anime.title_english && (
                    <p className="text-sm text-muted-foreground">{anime.title_english}</p>
                  )}
                </div>
                {anime.description && (
                  <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                    {anime.description}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{anime.type}</Badge>
                  <Badge variant="outline">{anime.status}</Badge>
                  {anime.rating && (
                    <Badge variant="outline">⭐ {anime.rating}/10</Badge>
                  )}
                  {anime.genres?.slice(0, 4).map((genre) => (
                    <Badge key={genre} variant="outline">{genre}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Recommended Anime */}
        {recommendedAnime && recommendedAnime.length > 0 && (
          <div className="animate-fade-in space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <SkipForward className="h-6 w-6 text-primary" />
              You Might Also Like
            </h2>
            <AnimeSection
              title=""
              animes={recommendedAnime}
              layout="scroll"
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}