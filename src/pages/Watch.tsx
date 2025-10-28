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
import { Loader2, Play, ChevronLeft, ChevronRight, Server } from 'lucide-react';
import { AnimeSection } from '@/components/AnimeSection';
import { useQuery } from '@tanstack/react-query';

interface Episode {
  id: string;
  episode_number: number;
  season_number: number;
  title: string | null;
  video_url: string;
  thumbnail: string | null;
}

interface Anime {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  genres: string[];
  type: string;
}

export default function Watch() {
  const { animeId, episodeId } = useParams();
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedServer, setSelectedServer] = useState('server1');
  const [episodeRange, setEpisodeRange] = useState(0);

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
        .limit(6);
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

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Video Player */}
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="aspect-video bg-black relative">
            {selectedEpisode ? (
              <iframe
                src={selectedEpisode.video_url}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white">Select an episode to watch</p>
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{anime?.title}</h2>
                {selectedEpisode && (
                  <p className="text-muted-foreground">
                    Season {selectedEpisode.season_number} - Episode {selectedEpisode.episode_number}
                    {selectedEpisode.title && `: ${selectedEpisode.title}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevEpisode}
                  disabled={!episodes || !selectedEpisode || episodes[0].id === selectedEpisode.id}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextEpisode}
                  disabled={!episodes || !selectedEpisode || episodes[episodes.length - 1].id === selectedEpisode.id}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Server Selection */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Server className="h-4 w-4" />
                Server:
              </span>
              {['server1', 'server2', 'server3', 'server4'].map((server) => (
                <Button
                  key={server}
                  variant={selectedServer === server ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedServer(server)}
                >
                  {server.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Episodes List */}
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <Tabs value={selectedSeason.toString()} onValueChange={(v) => {
            setSelectedSeason(parseInt(v));
            setEpisodeRange(0);
          }}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                {seasons.map((season) => (
                  <TabsTrigger key={season} value={season.toString()}>
                    Season {season}
                  </TabsTrigger>
                ))}
              </TabsList>

              {totalPages > 1 && (
                <Select value={episodeRange.toString()} onValueChange={(v) => setEpisodeRange(parseInt(v))}>
                  <SelectTrigger className="w-[200px]">
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
              <TabsContent key={season} value={season.toString()} className="space-y-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {displayedEpisodes.map((episode) => (
                    <Button
                      key={episode.id}
                      variant={selectedEpisode?.id === episode.id ? 'default' : 'outline'}
                      className="h-12"
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
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex gap-4">
              {anime.cover_image && (
                <img
                  src={anime.cover_image}
                  alt={anime.title}
                  className="w-32 h-48 object-cover rounded"
                />
              )}
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-bold">{anime.title}</h3>
                <p className="text-muted-foreground line-clamp-3">{anime.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{anime.type}</Badge>
                  {anime.genres?.map((genre) => (
                    <Badge key={genre} variant="outline">{genre}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Recommended Anime */}
        {recommendedAnime && recommendedAnime.length > 0 && (
          <div className="animate-fade-in">
            <AnimeSection
              title="Recommended for You"
              animes={recommendedAnime}
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
