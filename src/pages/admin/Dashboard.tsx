import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  UserPlus,
  Clock,
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

export default function AdminDashboard() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchStats();
    fetchRecentActivity();
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
        newUsersCount,
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
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalAnime: animeCount?.count || 0,
        totalEpisodes: episodeCount?.count || 0,
        totalUsers: userCount?.count || 0,
        trending: trendingCount?.count || 0,
        totalViews: watchHistoryCount?.count || 0,
        newUsers: newUsersCount?.count || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    // Mock recent activity data - replace with actual API calls
    const activity = [
      { id: 1, action: "New user registered", time: "2 mins ago", type: "user" },
      { id: 2, action: "Episode added: One Piece 1085", time: "15 mins ago", type: "episode" },
      { id: 3, action: "Anime updated: Jujutsu Kaisen", time: "1 hour ago", type: "anime" },
      { id: 4, action: "Server status changed", time: "2 hours ago", type: "server" },
    ];
    setRecentActivity(activity);
  };

  if (!isAdmin) return null;

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }: any) => (
    <Card className="group relative overflow-hidden border border-border/40 bg-card/50 backdrop-blur-xl hover:bg-card/70 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {value}
                </h3>
                {trend && (
                  <span className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                  </span>
                )}
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );

  // Chart data
  const barChartData = [
    { name: "Anime", count: stats?.totalAnime || 0 },
    { name: "Episodes", count: stats?.totalEpisodes || 0 },
    { name: "Users", count: stats?.totalUsers || 0 },
    { name: "Trending", count: stats?.trending || 0 },
    { name: "Views", count: stats?.totalViews || 0 },
  ];

  const lineChartData = [
    { day: "Mon", views: 400, users: 240 },
    { day: "Tue", views: 600, users: 380 },
    { day: "Wed", views: 800, users: 500 },
    { day: "Thu", views: 1200, users: 750 },
    { day: "Fri", views: 900, users: 600 },
    { day: "Sat", views: 1500, users: 900 },
    { day: "Sun", views: 1800, users: 1100 },
  ];

  const pieData = [
    { name: "Active", value: 75 },
    { name: "Inactive", value: 15 },
    { name: "New", value: 10 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <Navbar />
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-border/40 backdrop-blur-sm">
            <Activity className="h-6 w-6 text-purple-500" />
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground mt-3 text-lg">
            Comprehensive analytics and management for your anime platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Anime" 
            value={stats?.totalAnime} 
            icon={Film} 
            color="from-purple-500 to-purple-600"
            trend={12}
            subtitle="+5 this week"
          />
          <StatCard 
            title="Episodes" 
            value={stats?.totalEpisodes} 
            icon={Play} 
            color="from-cyan-500 to-cyan-600"
            trend={8}
            subtitle="+23 this week"
          />
          <StatCard 
            title="Active Users" 
            value={stats?.totalUsers} 
            icon={Users} 
            color="from-green-500 to-green-600"
            trend={15}
            subtitle="+42 this week"
          />
          <StatCard 
            title="Total Views" 
            value={stats?.totalViews} 
            icon={Eye} 
            color="from-orange-500 to-orange-600"
            trend={22}
            subtitle="All time"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Chart */}
          <Card className="border border-border/40 bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineChartData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        backdropFilter: "blur(16px)",
                      }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#8884d8" fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="users" stroke="#82ca9d" fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Chart */}
          <Card className="border border-border/40 bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-cyan-500" />
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        backdropFilter: "blur(16px)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <Card className="lg:col-span-1 border border-border/40 bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-orange-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors duration-300">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'user' ? 'bg-green-500/20 text-green-500' :
                      activity.type === 'episode' ? 'bg-blue-500/20 text-blue-500' :
                      activity.type === 'anime' ? 'bg-purple-500/20 text-purple-500' :
                      'bg-orange-500/20 text-orange-500'
                    }`}>
                      {activity.type === 'user' && <UserPlus className="h-4 w-4" />}
                      {activity.type === 'episode' && <Play className="h-4 w-4" />}
                      {activity.type === 'anime' && <Film className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Chart */}
          <Card className="lg:col-span-2 border border-border/40 bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        backdropFilter: "blur(16px)",
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[6, 6, 0, 0]}
                      className="fill-primary hover:fill-primary/80 transition-colors duration-300"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card className="border border-border/40 bg-card/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <Tabs defaultValue="anime" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-background/50 p-1 rounded-xl">
                <TabsTrigger value="anime" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                  Anime
                </TabsTrigger>
                <TabsTrigger value="episodes" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                  Episodes
                </TabsTrigger>
                <TabsTrigger value="servers" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                  Servers
                </TabsTrigger>
                <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                  Users
                </TabsTrigger>
              </TabsList>

              <TabsContent value="anime" className="mt-6 animate-fade-in">
                <AnimeManagement onUpdate={fetchStats} />
              </TabsContent>
              <TabsContent value="episodes" className="mt-6 animate-fade-in">
                <EpisodeManagement />
              </TabsContent>
              <TabsContent value="servers" className="mt-6 animate-fade-in">
                <ServerManagement />
              </TabsContent>
              <TabsContent value="schedule" className="mt-6 animate-fade-in">
                <ScheduleManagement />
              </TabsContent>
              <TabsContent value="users" className="mt-6 animate-fade-in">
                <UserManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
