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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Heart, 
  Clock, 
  Settings, 
  Palette, 
  Upload, 
  Save,
  Link as LinkIcon,
  Globe,
  Github,
  Twitter,
  Instagram,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function ProfileAdvanced() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    github: '',
    twitter: '',
    instagram: '',
  });
  const [customTheme, setCustomTheme] = useState({
    style: 'cyberpunk',
    primary: 'purple',
  });
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
      setSocialLinks((data.social_links as any) || { website: '', github: '', twitter: '', instagram: '' });
      setCustomTheme((data.custom_theme as any) || { style: 'cyberpunk', primary: 'purple' });
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

  const updateProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        username, 
        bio,
        cover_image: coverImage,
        avatar_url: avatarUrl,
        social_links: socialLinks,
        custom_theme: customTheme,
        favorite_genres: favoriteGenres,
      })
      .eq('id', user?.id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated successfully!" });
      fetchProfile();
    }
  };

  const availableGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'];

  const toggleGenre = (genre: string) => {
    setFavoriteGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative">
        {/* Cover Image */}
        <div 
          className="h-64 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 relative"
          style={coverImage ? {
            backgroundImage: `url(${coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>

        {/* Profile Header */}
        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <Card className="p-6 border-primary/20 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <Avatar className="h-32 w-32 border-4 border-primary/50 shadow-xl">
                <AvatarFallback className="bg-gradient-primary text-4xl text-white">
                  {username?.[0]?.toUpperCase() || <User className="h-16 w-16" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold text-gradient mb-2 flex items-center gap-2 justify-center md:justify-start">
                  <Sparkles className="h-8 w-8 text-primary" />
                  {profile?.username || 'User'}
                </h1>
                <p className="text-muted-foreground mb-3">{user?.email}</p>
                {bio && (
                  <p className="text-foreground/80 max-w-2xl">{bio}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                  {favoriteGenres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="bg-primary/20">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" onClick={signOut} className="shrink-0">
                Sign Out
              </Button>
            </div>

            {/* Social Links */}
            {(socialLinks.website || socialLinks.github || socialLinks.twitter || socialLinks.instagram) && (
              <div className="flex items-center justify-center md:justify-start gap-3 mt-6 pt-6 border-t border-border/50">
                {socialLinks.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {socialLinks.github && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://github.com/${socialLinks.github}`} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {socialLinks.twitter && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {socialLinks.instagram && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm border border-primary/20">
            <TabsTrigger value="favorites" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-6">
            <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm mb-4">
              <h3 className="text-lg font-semibold mb-2">Your Favorite Anime</h3>
              <p className="text-sm text-muted-foreground">{favorites.length} anime in your favorites</p>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favorites.map((fav) => (
                <AnimeCard
                  key={fav.id}
                  id={fav.anime.slug || fav.anime.id}
                  title={fav.anime.title}
                  coverImage={fav.anime.cover_image}
                  rating={fav.anime.rating}
                  status={fav.anime.status}
                  episodes={fav.anime.total_episodes}
                />
              ))}
            </div>
            {favorites.length === 0 && (
              <Card className="p-12 text-center border-primary/20 bg-card/50 backdrop-blur-sm">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h4 className="text-lg font-semibold mb-2">No favorites yet</h4>
                <p className="text-muted-foreground">Start adding your favorite anime to see them here</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm mb-4">
              <h3 className="text-lg font-semibold mb-2">Watch History</h3>
              <p className="text-sm text-muted-foreground">{watchHistory.length} recently watched</p>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {watchHistory.map((item) => (
                <AnimeCard
                  key={item.id}
                  id={item.anime.slug || item.anime.id}
                  title={item.anime.title}
                  coverImage={item.anime.cover_image}
                  rating={item.anime.rating}
                  status={item.anime.status}
                  episodes={item.anime.total_episodes}
                />
              ))}
            </div>
            {watchHistory.length === 0 && (
              <Card className="p-12 text-center border-primary/20 bg-card/50 backdrop-blur-sm">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h4 className="text-lg font-semibold mb-2">No watch history</h4>
                <p className="text-muted-foreground">Your viewing history will appear here</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid gap-6 max-w-4xl mx-auto">
              {/* Basic Info */}
              <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <User className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">Basic Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your username"
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
                </div>
              </Card>

              {/* Appearance */}
              <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Palette className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">Appearance</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="avatar"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover">Cover Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cover"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="https://..."
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Social Links */}
              <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <LinkIcon className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">Social Links</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={socialLinks.github}
                      onChange={(e) => setSocialLinks({...socialLinks, github: e.target.value})}
                      placeholder="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                      placeholder="username"
                    />
                  </div>
                </div>
              </Card>

              {/* Favorite Genres */}
              <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold">Favorite Genres</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableGenres.map((genre) => (
                    <Badge
                      key={genre}
                      variant={favoriteGenres.includes(genre) ? "default" : "outline"}
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Save Button */}
              <Button 
                onClick={updateProfile} 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                Save All Changes
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
