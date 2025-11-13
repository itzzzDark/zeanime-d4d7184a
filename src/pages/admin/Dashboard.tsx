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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function AdminDashboard() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
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
        episodeCount,
        userCount,
        trendingCount,
        watchHistoryCount,
      ] = await Promise.all([
        supabase.from("anime").select("*", { count: "exact", head: true }),
        supabase.from("episodes").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("anime")
          .select("*", { count: "exact", head: true })
          .eq("is_trending", true),
        supabase
          .from("watch_history")
          .select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalAnime: animeCount?.count || 0,
        totalEpisodes: episodeCount?.count || 0,
        totalUsers: userCount?.count || 0,
        trending: trendingCount?.count || 0,
        totalViews: watchHistoryCount?.count || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card
      className={`p-5 border border-border/40 bg-card/70 backdrop-blur-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          )}
        </div>
        <div
          className={`p-3 rounded-xl bg-${color}/20 text-${color} flex items-center justify-center`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );

  // Chart mock data (can be made dynamic)
  const chartData = [
    { name: "Anime", count: stats?.totalAnime || 0 },
    { name: "Episodes", count: stats?.totalEpisodes || 0 },
    { name: "Users", count: stats?.totalUsers || 0 },
    { name: "Trending", count: stats?.trending || 0 },
    { name: "Views", count: stats?.totalViews || 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-background/70">
      <Navbar />
      <div className="container mx-auto px-4 py-10 animate-fade-in">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage, analyze, and monitor your anime database with ease.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <StatCard title="Anime" value={stats?.totalAnime} icon={Film} color="purple-500" />
          <StatCard title="Episodes" value={stats?.totalEpisodes} icon={Play} color="cyan-500" />
          <StatCard title="Users" value={stats?.totalUsers} icon={Users} color="green-500" />
          <StatCard title="Trending" value={stats?.trending} icon={TrendingUp} color="pink-500" />
          <StatCard title="Views" value={stats?.totalViews} icon={Eye} color="orange-500" />
        </div>

        {/* Analytics Chart */}
        <Card className="p-6 border border-border/40 bg-card/70 backdrop-blur-md mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" /> Analytics Overview
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Management Tabs */}
        <Tabs defaultValue="anime" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="anime">Anime</TabsTrigger>
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
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
