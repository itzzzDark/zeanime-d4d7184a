import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Film,
  Users,
  Play,
  TrendingUp,
  Activity,
  BarChart3,
  Eye,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimeManagement from "@/components/admin/AnimeManagement";
import EpisodeManagement from "@/components/admin/EpisodeManagement";
import UserManagement from "@/components/admin/UserManagement";
import ScheduleManagement from "@/components/admin/ScheduleManagement";
import ServerManagement from "@/components/admin/ServerManagement";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchStats();
  }, [user, isAdmin, navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [
        animeCount,
        seriesCount,
        moviesCount,
        episodeCount,
        seasonsData,
        userCount,
        trendingCount,
        commentsCount,
        favoritesCount,
        watchHistoryCount,
      ] = await Promise.all([
        supabase.from("anime").select("*", { count: "exact", head: true }),
        supabase
          .from("anime")
          .select("*", { count: "exact", head: true })
          .eq("type", "series"),
        supabase
          .from("anime")
          .select("*", { count: "exact", head: true })
          .eq("type", "movie"),
        supabase.from("episodes").select("*", { count: "exact", head: true }),
        supabase.from("episodes").select("season_number"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("anime")
          .select("*", { count: "exact", head: true })
          .eq("is_trending", true),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("favorites").select("*", { count: "exact", head: true }),
        supabase
          .from("watch_history")
          .select("*", { count: "exact", head: true }),
      ]);

      // Handle possible null responses gracefully
      const uniqueSeasons = new Set(
        seasonsData.data?.map((ep) => ep.season_number).filter(Boolean) || []
      );

      setStats({
        totalAnime: animeCount?.count || 0,
        totalSeries: seriesCount?.count || 0,
        totalMovies: moviesCount?.count || 0,
        totalEpisodes: episodeCount?.count || 0,
        totalSeasons: uniqueSeasons.size,
        totalUsers: userCount?.count || 0,
        trending: trendingCount?.count || 0,
        totalComments: commentsCount?.count || 0,
        totalFavorites: favoritesCount?.count || 0,
        totalWatchHistory: watchHistoryCount?.count || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  const StatCard = ({ title, value, icon: Icon, subtitle, color = "primary" }) => (
    <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm hover-lift animate-scale-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <h3 className="text-3xl font-bold text-primary">{value}</h3>
          )}
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-lg bg-${color}/20`}>
          <Icon className={`h-7 w-7 text-${color}`} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gradient mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your anime database, users, servers, and more.
          </p>
        </div>

        {/* --- Stats Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Anime" value={stats?.totalAnime} icon={Film} subtitle="All titles" />
          <StatCard title="Series" value={stats?.totalSeries} icon={Play} subtitle="TV Shows" />
          <StatCard title="Movies" value={stats?.totalMovies} icon={Film} subtitle="Films" color="accent" />
          <StatCard title="Episodes" value={stats?.totalEpisodes} icon={Play} subtitle="All episodes" />
          <StatCard title="Seasons" value={stats?.totalSeasons} icon={Calendar} subtitle="Unique seasons" color="secondary" />
          <StatCard title="Users" value={stats?.totalUsers} icon={Users} subtitle="Registered" color="secondary" />
          <StatCard title="Trending" value={stats?.trending} icon={TrendingUp} subtitle="Hot titles" color="accent" />
          <StatCard title="Watch History" value={stats?.totalWatchHistory} icon={Eye} subtitle="Total views" />
        </div>

        {/* --- Tabs Section --- */}
        <Tabs defaultValue="anime" className="w-full animate-fade-in">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="anime" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Anime
            </TabsTrigger>
            <TabsTrigger value="episodes" className="gap-2">
              <Play className="h-4 w-4" /> Episodes
            </TabsTrigger>
            <TabsTrigger value="servers" className="gap-2">
              <Activity className="h-4 w-4" /> Servers
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Film className="h-4 w-4" /> Schedule
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anime" className="mt-6">
            <AnimeManagement onUpdate={fetchStats} />
          </TabsContent>
          <TabsContent value="episodes" className="mt-6">
            <EpisodeManagement />
          </TabsContent>
          <TabsContent value="servers" className="mt-6">
            <ServerManagement />
          </TabsContent>
          <TabsContent value="schedule" className="mt-6">
            <ScheduleManagement />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
