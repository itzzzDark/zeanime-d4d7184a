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
  Sparkles,
  Database,
  Server,
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
      { id: 4, action: "Server configuration updated", time: "2 hours ago", type: "server" },
    ];
    setRecentActivity(activity);
  };

  if (!isAdmin) return null;

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }: any) => (
    <Card className="group relative overflow-hidden border border-gray-200/60 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-gray-200" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900">
                  {value?.toLocaleString()}
                </h3>
                {trend && (
                  <span className={`text-sm px-1.5 py-0.5 rounded-full ${
                    trend > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
                  </span>
                )}
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
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
    { name: "Active Users", value: 75 },
    { name: "New Users", value: 15 },
    { name: "Returning", value: 10 },
  ];

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B'];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/60 shadow-sm mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Manage your anime platform with ease
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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
            color="from-blue-500 to-cyan-500"
            trend={8}
            subtitle="+23 this week"
          />
          <StatCard 
            title="Active Users" 
            value={stats?.totalUsers} 
            icon={Users} 
            color="from-emerald-500 to-green-500"
            trend={15}
            subtitle="+42 this week"
          />
          <StatCard 
            title="Total Views" 
            value={stats?.totalViews} 
            icon={Eye} 
            color="from-amber-500 to-orange-500"
            trend={22}
            subtitle="All time"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Chart */}
          <Card className="border border-gray-200/60 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Weekly Activity
                <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineChartData}>
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
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorViews)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Chart */}
          <Card className="border border-gray-200/60 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Users className="h-5 w-5 text-cyan-500" />
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        backdropFilter: "blur(16px)",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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
          <Card className="border border-gray-200/60 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Clock className="h-5 w-5 text-amber-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
                  >
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
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

          {/* Main Chart */}
          <Card className="lg:col-span-2 border border-gray-200/60 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                Platform Overview
                <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                  Summary
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.6} />
                    <XAxis 
                      dataKey="name" 
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
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[4, 4, 0, 0]}
                      className="fill-purple-500 hover:fill-purple-600 transition-colors duration-200"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card className="border border-gray-200/60 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="anime" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100/50 p-1 rounded-xl gap-1">
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
                    className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200 text-gray-600"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-6">
                <TabsContent value="anime" className="m-0 animate-fade-in">
                  <AnimeManagement onUpdate={fetchStats} />
                </TabsContent>
                <TabsContent value="episodes" className="m-0 animate-fade-in">
                  <EpisodeManagement />
                </TabsContent>
                <TabsContent value="servers" className="m-0 animate-fade-in">
                  <ServerManagement />
                </TabsContent>
                <TabsContent value="schedule" className="m-0 animate-fade-in">
                  <ScheduleManagement />
                </TabsContent>
                <TabsContent value="users" className="m-0 animate-fade-in">
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
