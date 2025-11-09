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
import { AnimeCard } from '@/components/AnimeCard';
import { User, Heart, Clock, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchFavorites();
    fetchWatchlist();
    fetchWatchHistory();
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
    }
  };

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('*, anime(*)')
      .eq('user_id', user?.id);
    
    if (data) setFavorites(data);
  };

  const fetchWatchlist = async () => {
    const { data } = await supabase
      .from('watchlist')
      .select('*, anime(*)')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false });
    
    if (data) setWatchlist(data);
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

  const updateProfile = async () => {
    await supabase
      .from('profiles')
      .update({ username, bio })
      .eq('id', user?.id);
    
    fetchProfile();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-gradient-primary flex items-center justify-center">
              <User className="h-12 w-12 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gradient mb-2">{profile?.username || 'User'}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </Card>

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="favorites">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="watchlist">
              <List className="h-4 w-4 mr-2" />
              Watchlist
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings">
              <User className="h-4 w-4 mr-2" />
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
              <p className="text-center text-muted-foreground py-12">No favorites yet</p>
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {watchlist.map((item) => (
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
            {watchlist.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No items in watchlist yet</p>
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
              <p className="text-center text-muted-foreground py-12">No watch history yet</p>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="p-6 max-w-2xl mx-auto border-border/50">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={updateProfile}>Save Changes</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}