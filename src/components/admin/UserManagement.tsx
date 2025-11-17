import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  Users,
  Crown,
  Search,
  User,
  Mail,
  Calendar,
  Sparkles,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Ban,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  user_roles: { role: 'admin' | 'moderator' | 'user' }[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(profilesData || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingUsers(prev => new Set(prev).add(userId));

    try {
      // Remove existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: newRole as 'admin' | 'moderator' | 'user' }]);

      if (error) throw error;

      toast({ 
        title: "Success", 
        description: "User role updated successfully" 
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update user role", 
        variant: "destructive" 
      });
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setUpdatingUsers(prev => new Set(prev).add(userId));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({ 
        title: "Success", 
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully` 
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update user status", 
        variant: "destructive" 
      });
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const currentRole = user.user_roles?.[0]?.role || 'user';
    const matchesRole = filterRole === 'all' || currentRole === filterRole;
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.user_roles?.[0]?.role === 'admin').length,
    moderators: users.filter(u => u.user_roles?.[0]?.role === 'moderator').length,
    regularUsers: users.filter(u => u.user_roles?.[0]?.role === 'user').length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-100 border-yellow-200' },
      moderator: { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100 border-blue-200' },
      user: { icon: User, color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200' },
    }[role] || { icon: User, color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200' };

    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.bg} ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getInitials = (username: string | null) => {
    return username?.[0]?.toUpperCase() || 'U';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage user accounts and permissions ({users.length} total users)
          </p>
        </div>
        <Button 
          onClick={() => fetchUsers()} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <h3 className="text-2xl font-bold text-yellow-600">{stats.admins}</h3>
            </div>
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Moderators</p>
              <h3 className="text-2xl font-bold text-blue-600">{stats.moderators}</h3>
            </div>
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Users</p>
              <h3 className="text-2xl font-bold text-gray-600">{stats.regularUsers}</h3>
            </div>
            <User className="h-8 w-8 text-gray-500" />
          </div>
        </Card>
        <Card className="p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.inactive}</h3>
            </div>
            <Ban className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Users</h2>
            <p className="text-sm text-gray-600">
              Search and filter users by role or status
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="moderator">Moderators</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-900">User</TableHead>
                <TableHead className="font-semibold text-gray-900">Email</TableHead>
                <TableHead className="font-semibold text-gray-900">Joined</TableHead>
                <TableHead className="font-semibold text-gray-900">Last Active</TableHead>
                <TableHead className="font-semibold text-gray-900">Role</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <LoadingSkeleton />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No users found</h4>
                    <p className="text-gray-600">Try adjusting your search or filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const currentRole = user.user_roles?.[0]?.role || 'user';
                  const isUpdating = updatingUsers.has(user.id);

                  return (
                    <TableRow key={user.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-gray-200">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getInitials(user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {user.username || 'Anonymous'}
                            </p>
                            {user.bio && (
                              <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                                {user.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(currentRole)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.is_active ? "default" : "secondary"} 
                          className={user.is_active ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={currentRole}
                            onValueChange={(value) => updateUserRole(user.id, value)}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-32">
                              {isUpdating ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  User
                                </div>
                              </SelectItem>
                              <SelectItem value="moderator">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Moderator
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4" />
                                  Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            disabled={isUpdating}
                            title={user.is_active ? 'Deactivate user' : 'Activate user'}
                          >
                            {isUpdating ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : user.is_active ? (
                              <EyeOff className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
