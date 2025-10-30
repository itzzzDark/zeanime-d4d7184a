import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AnimeCard } from '@/components/AnimeCard';
import { User, Heart, Clock, Settings, Award, BarChart3, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function ProfileAdvanced() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalWatched: 0, totalTime: 0, favoriteCount: 0 });
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchFavorites();
    fetchWatchHistory();
    calculateStats();
  }, [user, navigate]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (data) {
      setProfile(data);
      setUsername(data.username || '');
      setBio(data.bio || '');
      setCoverImage(data.cover_image || '');
      setAvatarUrl(data.avatar_url || '');
      setFavoriteGenres(data.favorite_genres || []);
    }
  };

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('*, anime(*)')
      .eq('user_id', user?.id);
    
    if (data) setFavorites(data);
  };

  const fetchWatchHistory = async () => {
    const { data } = await supabase
      .from('watch_history')
      .select('*, anime(*), episodes(*)')
      .eq('user_id', user?.id)
      .order('last_watched', { ascending: false })
      .limit(20);
    
    if (data) setWatchHistory(data);
  };

  const calculateStats = async () => {
    const { data: historyData } = await supabase
      .from('watch_history')
      .select('*, episodes(duration)')
      .eq('user_id', user?.id);

    const { data: favData } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user?.id);

    const totalTime = historyData?.reduce((acc, item) => {
      return acc + (item.episodes?.duration || 0);
    }, 0) || 0;

    setStats({
      totalWatched: historyData?.length || 0,
      totalTime: Math.floor(totalTime / 60),
      favoriteCount: favData?.length || 0
    });
  };

  const updateProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        username, 
        bio, 
        cover_image: coverImage,
        avatar_url: avatarUrl,
        favorite_genres: favoriteGenres
      })
      .eq('id', user?.id);
    
    if (!error) {
      fetchProfile();
      toast({ title: "Profile updated successfully!" });
    } else {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural'];

  const toggleGenre = (genre: string) => {
    setFavoriteGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1419] via-[#0c1820] to-black">
      <Navbar />
      
      <div className="relative">
        {/* Cover Photo */}
        <div 
          className="h-64 bg-gradient-primary relative overflow-hidden"
          style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90"></div>
        </div>

        {/* Profile Header */}
        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <Card className="p-6 border-border/50 bg-card/90 backdrop-blur-xl shadow-card">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="h-32 w-32 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg glow-cyan">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <User className="h-16 w-16 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gradient mb-2">{profile?.username || 'User'}</h1>
                <p className="text-muted-foreground mb-4">{user?.email}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {favoriteGenres.map(genre => (
                    <Badge key={genre} variant="secondary">{genre}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span>{stats.totalWatched} watched</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-destructive" />
                    <span>{stats.favoriteCount} favorites</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-secondary" />
                    <span>{stats.totalTime}h total</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={signOut} className="hover-lift">
                Sign Out
              </Button>
            </div>
            {bio && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-foreground/80">{bio}</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="favorites">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Award className="h-4 w-4 mr-2" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favorites.map((fav) => (
                <AnimeCard
                  key={fav.id}
                  id={fav.anime.id}
                  title={fav.anime.title}
                  coverImage={fav.anime.cover_image}
                  rating={fav.anime.rating}
                  type={fav.anime.type}
                  status={fav.anime.status}
                  episodes={fav.anime.total_episodes}
                />
              ))}
            </div>
            {favorites.length === 0 && (
              <Card className="p-12 text-center border-border/50 bg-card/50">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No favorites yet</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {watchHistory.map((item) => (
                <AnimeCard
                  key={item.id}
                  id={item.anime.id}
                  title={item.anime.title}
                  coverImage={item.anime.cover_image}
                  rating={item.anime.rating}
                  type={item.anime.type}
                  status={item.anime.status}
                  episodes={item.anime.total_episodes}
                />
              ))}
            </div>
            {watchHistory.length === 0 && (
              <Card className="p-12 text-center border-border/50 bg-card/50">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No watch history yet</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-card transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{stats.totalWatched}</p>
                    <p className="text-muted-foreground">Episodes Watched</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-card transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{stats.favoriteCount}</p>
                    <p className="text-muted-foreground">Favorites</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-card transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{stats.totalTime}h</p>
                    <p className="text-muted-foreground">Watch Time</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="p-8 max-w-3xl mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-gradient mb-6">Customize Profile</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Avatar URL
                    </div>
                  </Label>
                  <Input
                    id="avatar"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Cover Image URL
                    </div>
                  </Label>
                  <Input
                    id="cover"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Favorite Genres</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map(genre => (
                      <Badge
                        key={genre}
                        variant={favoriteGenres.includes(genre) ? "default" : "outline"}
                        className="cursor-pointer hover-lift"
                        onClick={() => toggleGenre(genre)}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={updateProfile} className="w-full h-12 text-lg hover-lift">
                  Save Changes
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}