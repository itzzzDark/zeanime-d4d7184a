import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  Sparkles,
  Database,
  Server,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimeManagement from "@/components/admin/AnimeManagement";
import EpisodeManagement from "@/components/admin/EpisodeManagement";
import UserManagement from "@/components/admin/UserManagement";
import ScheduleManagement from "@/components/admin/ScheduleManagement";
import ServerManagement from "@/components/admin/ServerManagement";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Legend,
} from "recharts";

interface DashboardStats {
  totalAnime: number;
  totalEpisodes: number;
  totalUsers: number;
  trending: number;
  totalViews: number;
  newUsers: number;
  activeToday: number;
  averageWatchTime: number;
}

export default function AdminDashboard() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchStats();
    fetchRecentActivity();
  }, [user, isAdmin, navigate]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [
        animeCount,
        episodeCount,
        userCount,
        trendingCount,
        watchHistoryCount,
        newUsersCount,
        activeTodayCount,
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
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte('last_sign_in_at', new Date().toISOString().split('T')[0]),
      ]);

      setStats({
        totalAnime: animeCount?.count || 0,
        totalEpisodes: episodeCount?.count || 0,
        totalUsers: userCount?.count || 0,
        trending: trendingCount?.count || 0,
        totalViews: watchHistoryCount?.count || 0,
        newUsers: newUsersCount?.count || 0,
        activeToday: activeTodayCount?.count || 0,
        averageWatchTime: 24, // Mock data - replace with actual calculation
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Fetch actual recent activity from multiple tables
      const [recentAnime, recentEpisodes, recentUsers] = await Promise.all([
        supabase
          .from('anime')
          .select('title, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('episodes')
          .select('title, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('profiles')
          .select('username, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const activity = [
        ...(recentUsers.data?.map((user, index) => ({
          id: `user-${index}`,
          action: `New user registered: ${user.username || 'Anonymous'}`,
          time: new Date(user.created_at).toLocaleDateString(),
          type: "user" as const,
        })) || []),
        ...(recentEpisodes.data?.map((episode, index) => ({
          id: `episode-${index}`,
          action: `Episode added: ${episode.title || 'Untitled'}`,
          time: new Date(episode.created_at).toLocaleDateString(),
          type: "episode" as const,
        })) || []),
        ...(recentAnime.data?.map((anime, index) => ({
          id: `anime-${index}`,
          action: `Anime added: ${anime.title}`,
          time: new Date(anime.created_at).toLocaleDateString(),
          type: "anime" as const,
        })) || []),
      ].slice(0, 6); // Take only the 6 most recent activities

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchRecentActivity()]);
  };

  if (!isAdmin) return null;

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    trend, 
    subtitle, 
    change 
  }: any) => (
    <Card className="group relative overflow-hidden border border-gray-200 bg-white hover:border-gray-300 transition-all duration-300 hover:shadow-lg rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-gray-200" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </h3>
                {change && (
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                    change > 0 
                      ? 'bg-green-100 text-green-700' 
                      : change < 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {change > 0 ? <ArrowUp className="h-3 w-3" /> : 
                     change < 0 ? <ArrowDown className="h-3 w-3" /> : null}
                    {Math.abs(change)}%
                  </span>
                )}
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Enhanced chart data with time ranges
  const getChartData = (range: 'week' | 'month' | 'year') => {
    const baseData = {
      week: [
        { day: "Mon", views: 400, users: 240, revenue: 120 },
        { day: "Tue", views: 600, users: 380, revenue: 180 },
        { day: "Wed", views: 800, users: 500, revenue: 240 },
        { day: "Thu", views: 1200, users: 750, revenue: 360 },
        { day: "Fri", views: 900, users: 600, revenue: 270 },
        { day: "Sat", views: 1500, users: 900, revenue: 450 },
        { day: "Sun", views: 1800, users: 1100, revenue: 540 },
      ],
      month: Array.from({ length: 30 }, (_, i) => ({
        day: `Day ${i + 1}`,
        views: Math.floor(Math.random() * 2000) + 500,
        users: Math.floor(Math.random() * 1200) + 300,
        revenue: Math.floor(Math.random() * 600) + 150,
      })),
      year: Array.from({ length: 12 }, (_, i) => ({
        day: new Date(2024, i).toLocaleString('default', { month: 'short' }),
        views: Math.floor(Math.random() * 50000) + 20000,
        users: Math.floor(Math.random() * 20000) + 10000,
        revenue: Math.floor(Math.random() * 15000) + 5000,
      })),
    };
    return baseData[range];
  };

  const barChartData = [
    { name: "Anime", count: stats?.totalAnime || 0, fill: "#8B5CF6" },
    { name: "Episodes", count: stats?.totalEpisodes || 0, fill: "#06B6D4" },
    { name: "Users", count: stats?.totalUsers || 0, fill: "#10B981" },
    { name: "Trending", count: stats?.trending || 0, fill: "#F59E0B" },
    { name: "Views", count: stats?.totalViews || 0, fill: "#EF4444" },
  ];

  const pieData = [
    { name: "Active Users", value: 75, fill: "#10B981" },
    { name: "New Users", value: 15, fill: "#3B82F6" },
    { name: "Returning", value: 10, fill: "#8B5CF6" },
  ];

  const ActivityIcon = ({ type }: { type: string }) => {
    const icons = {
      user: <UserPlus className="h-4 w-4" />,
      episode: <Play className="h-4 w-4" />,
      anime: <Film className="h-4 w-4" />,
      server: <Server className="h-4 w-4" />,
    };
    
    const colors = {
      user: "bg-emerald-100 text-emerald-600",
      episode: "bg-blue-100 text-blue-600",
      anime: "bg-purple-100 text-purple-600",
      server: "bg-amber-100 text-amber-600",
    };

    return (
      <div className={`p-2 rounded-lg ${colors[type as keyof typeof colors]}`}>
        {icons[type as keyof typeof icons]}
      </div>
    );
  };

  const exportData = () => {
    // Simple data export functionality
    const dataStr = JSON.stringify(stats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Dashboard statistics exported successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive overview of your anime platform
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={exportData}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Anime" 
            value={stats?.totalAnime} 
            icon={Film} 
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            change={8}
            subtitle="Active series"
          />
          <StatCard 
            title="Episodes" 
            value={stats?.totalEpisodes} 
            icon={Play} 
            color="bg-gradient-to-br from-blue-500 to-cyan-500"
            change={12}
            subtitle="Available content"
          />
          <StatCard 
            title="Active Users" 
            value={stats?.totalUsers} 
            icon={Users} 
            color="bg-gradient-to-br from-emerald-500 to-green-500"
            change={15}
            subtitle={`${stats?.activeToday || 0} online today`}
          />
          <StatCard 
            title="Total Views" 
            value={stats?.totalViews} 
            icon={Eye} 
            color="bg-gradient-to-br from-amber-500 to-orange-500"
            change={22}
            subtitle="All-time engagement"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Activity Chart */}
          <Card className="xl:col-span-2 border border-gray-200 bg-white rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Platform Analytics
                <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
                  {timeRange}
                </Badge>
              </CardTitle>
              <div className="flex gap-1">
                {(['week', 'month', 'year'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className="capitalize"
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData(timeRange)}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.6} />
                    <XAxis 
                      dataKey="day" 
                      stroke="#6B7280" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6B7280" 
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        backdropFilter: "blur(16px)",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px"
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorViews)" 
                      name="Page Views"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                      name="Active Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution & Activity */}
          <div className="space-y-6">
            {/* Distribution Chart */}
            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Users className="h-5 w-5 text-cyan-500" />
                  User Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={60}
                        innerRadius={30}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {recentActivity.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <ActivityIcon type={activity.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Management Tabs */}
        <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="anime" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg gap-1">
                {[
                  { value: "anime", label: "Anime", icon: Film },
                  { value: "episodes", label: "Episodes", icon: Play },
                  { value: "servers", label: "Servers", icon: Database },
                  { value: "schedule", label: "Schedule", icon: Calendar },
                  { value: "users", label: "Users", icon: Users },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200 text-gray-600 font-medium"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-6">
                <TabsContent value="anime" className="m-0">
                  <AnimeManagement onUpdate={fetchStats} />
                </TabsContent>
                <TabsContent value="episodes" className="m-0">
                  <EpisodeManagement />
                </TabsContent>
                <TabsContent value="servers" className="m-0">
                  <ServerManagement />
                </TabsContent>
                <TabsContent value="schedule" className="m-0">
                  <ScheduleManagement />
                </TabsContent>
                <TabsContent value="users" className="m-0">
                  <UserManagement />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
