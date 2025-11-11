import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, Crown, Search, User, Mail, Calendar, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .order('created_at', { ascending: false });
    
    if (profilesData) setUsers(profilesData);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    // Remove existing role
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Add new role
    const { error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role: newRole as 'admin' | 'moderator' | 'user' }]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "User role updated successfully" });
    fetchUsers();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const currentRole = user.user_roles?.[0]?.role || 'user';
    const matchesRole = filterRole === 'all' || currentRole === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.user_roles?.[0]?.role === 'admin').length,
    moderators: users.filter(u => u.user_roles?.[0]?.role === 'moderator').length,
    users: users.filter(u => u.user_roles?.[0]?.role === 'user').length,
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
      moderator: { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/20' },
      user: { icon: User, color: 'text-gray-400', bg: 'bg-gray-500/20' },
    }[role] || { icon: User, color: 'text-gray-400', bg: 'bg-gray-500/20' };

    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.bg} ${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <h3 className="text-3xl font-bold text-gradient">{stats.total}</h3>
            </div>
            <Users className="h-12 w-12 text-primary/50" />
          </div>
        </Card>
        <Card className="p-6 border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <h3 className="text-3xl font-bold text-yellow-400">{stats.admins}</h3>
            </div>
            <Crown className="h-12 w-12 text-yellow-500/50" />
          </div>
        </Card>
        <Card className="p-6 border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Moderators</p>
              <h3 className="text-3xl font-bold text-blue-400">{stats.moderators}</h3>
            </div>
            <Shield className="h-12 w-12 text-blue-500/50" />
          </div>
        </Card>
        <Card className="p-6 border-gray-500/20 bg-gradient-to-br from-gray-500/10 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Regular Users</p>
              <h3 className="text-3xl font-bold text-gray-400">{stats.users}</h3>
            </div>
            <User className="h-12 w-12 text-gray-500/50" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 border-primary/20 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-gradient">User Management</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="moderator">Moderators</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border-primary/20 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const currentRole = user.user_roles?.[0]?.role || 'user';
                return (
                  <TableRow key={user.id} className="border-border/50 hover:bg-primary/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-primary text-white">
                            {user.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{user.username || 'Anonymous'}</p>
                          {user.bio && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{user.bio}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Contact info
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(currentRole)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentRole}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h4 className="text-lg font-semibold mb-2">No users found</h4>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </Card>
    </div>
  );
}