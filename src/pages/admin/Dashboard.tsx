import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Film, Users, Play, TrendingUp, Activity, BarChart3, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnimeManagement from '@/components/admin/AnimeManagement';
import EpisodeManagement from '@/components/admin/EpisodeManagement';
import UserManagement from '@/components/admin/UserManagement';

export default function AdminDashboard() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAnime: 0,
    totalEpisodes: 0,
    totalUsers: 0,
    trending: 0,
    totalComments: 0,
    totalFavorites: 0,
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    fetchStats();
  }, [user, isAdmin, navigate]);

  const fetchStats = async () => {
    const [animeCount, episodeCount, userCount, trendingCount, commentsCount, favoritesCount] = await Promise.all([
      supabase.from('anime').select('*', { count: 'exact', head: true }),
      supabase.from('episodes').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('anime').select('*', { count: 'exact', head: true }).eq('is_trending', true),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('favorites').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      totalAnime: animeCount.count || 0,
      totalEpisodes: episodeCount.count || 0,
      totalUsers: userCount.count || 0,
      trending: trendingCount.count || 0,
      totalComments: commentsCount.count || 0,
      totalFavorites: favoritesCount.count || 0,
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gradient mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform management and analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm hover-lift animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Anime</p>
                <h3 className="text-3xl font-bold text-primary">{stats.totalAnime}</h3>
                <p className="text-xs text-muted-foreground mt-1">Active titles</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/20">
                <Film className="h-7 w-7 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm hover-lift animate-scale-in" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Episodes</p>
                <h3 className="text-3xl font-bold text-primary">{stats.totalEpisodes}</h3>
                <p className="text-xs text-muted-foreground mt-1">Available content</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/20">
                <Play className="h-7 w-7 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm hover-lift animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <h3 className="text-3xl font-bold text-primary">{stats.totalUsers}</h3>
                <p className="text-xs text-muted-foreground mt-1">Registered members</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary/20">
                <Users className="h-7 w-7 text-secondary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm hover-lift animate-scale-in" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trending Now</p>
                <h3 className="text-3xl font-bold text-primary">{stats.trending}</h3>
                <p className="text-xs text-muted-foreground mt-1">Popular titles</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent/20">
                <TrendingUp className="h-7 w-7 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm hover-lift animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comments</p>
                <h3 className="text-3xl font-bold text-primary">{stats.totalComments}</h3>
                <p className="text-xs text-muted-foreground mt-1">User engagement</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/20">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm hover-lift animate-scale-in" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Favorites</p>
                <h3 className="text-3xl font-bold text-primary">{stats.totalFavorites}</h3>
                <p className="text-xs text-muted-foreground mt-1">Bookmarked titles</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary/20">
                <Activity className="h-7 w-7 text-secondary" />
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="anime" className="w-full animate-fade-in">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="anime" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Anime Management
            </TabsTrigger>
            <TabsTrigger value="episodes" className="gap-2">
              <Play className="h-4 w-4" />
              Episodes
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anime" className="mt-6">
            <AnimeManagement onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="episodes" className="mt-6">
            <EpisodeManagement />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}