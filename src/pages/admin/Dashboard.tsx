import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Film, Users, Play, TrendingUp } from 'lucide-react';
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
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    fetchStats();
  }, [user, isAdmin, navigate]);

  const fetchStats = async () => {
    const [animeCount, episodeCount, userCount, trendingCount] = await Promise.all([
      supabase.from('anime').select('*', { count: 'exact', head: true }),
      supabase.from('episodes').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('anime').select('*', { count: 'exact', head: true }).eq('is_trending', true),
    ]);

    setStats({
      totalAnime: animeCount.count || 0,
      totalEpisodes: episodeCount.count || 0,
      totalUsers: userCount.count || 0,
      trending: trendingCount.count || 0,
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your anime streaming platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Anime</p>
                <h3 className="text-3xl font-bold text-primary">{stats.totalAnime}</h3>
              </div>
              <Film className="h-12 w-12 text-primary/50" />
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Episodes</p>
                <h3 className="text-3xl font-bold text-primary">{stats.totalEpisodes}</h3>
              </div>
              <Play className="h-12 w-12 text-primary/50" />
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <h3 className="text-3xl font-bold text-primary">{stats.totalUsers}</h3>
              </div>
              <Users className="h-12 w-12 text-primary/50" />
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trending</p>
                <h3 className="text-3xl font-bold text-primary">{stats.trending}</h3>
              </div>
              <TrendingUp className="h-12 w-12 text-primary/50" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="anime" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="anime">Anime Management</TabsTrigger>
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
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