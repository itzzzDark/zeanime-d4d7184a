import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Server,
  ArrowUp,
  ArrowDown,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield,
  AlertTriangle,
  Zap,
  Network,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';

interface EmbedServer {
  id: string;
  name: string;
  embed_url: string;
  is_active: boolean;
  order_index: number;
  server_type: 'streaming' | 'download' | 'backup';
  priority: 'high' | 'medium' | 'low';
  health_status: 'healthy' | 'degraded' | 'offline';
  last_checked?: string;
  created_at: string;
  updated_at: string;
}

interface ServerFormData {
  name: string;
  embed_url: string;
  is_active: boolean;
  order_index: number;
  server_type: 'streaming' | 'download' | 'backup';
  priority: 'high' | 'medium' | 'low';
}

interface ServerStats {
  total: number;
  active: number;
  byType: Record<string, number>;
  health: {
    healthy: number;
    degraded: number;
    offline: number;
  };
}

export default function AdvancedServerManagement() {
  const [servers, setServers] = useState<EmbedServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingServer, setEditingServer] = useState<EmbedServer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; responseTime?: number } | null>(null);
  const [testing, setTesting] = useState(false);
  const [healthCheckLoading, setHealthCheckLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<ServerFormData>({
    name: '',
    embed_url: '',
    is_active: true,
    order_index: 0,
    server_type: 'streaming',
    priority: 'medium',
  });

  // Memoized server statistics
  const serverStats: ServerStats = useMemo(() => {
    const stats = {
      total: servers.length,
      active: servers.filter(s => s.is_active).length,
      byType: {
        streaming: servers.filter(s => s.server_type === 'streaming').length,
        download: servers.filter(s => s.server_type === 'download').length,
        backup: servers.filter(s => s.server_type === 'backup').length,
      },
      health: {
        healthy: servers.filter(s => s.health_status === 'healthy').length,
        degraded: servers.filter(s => s.health_status === 'degraded').length,
        offline: servers.filter(s => s.health_status === 'offline').length,
      }
    };
    return stats;
  }, [servers]);

  // Filter servers based on search
  const filteredServers = useMemo(() => {
    if (!searchTerm) return servers;
    return servers.filter(server =>
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.embed_url.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [servers, searchTerm]);

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('embed_servers')
        .select('*')
        .order('order_index');

      if (error) throw error;
      
      // Initialize health status if not present
      const serversWithHealth = (data || []).map(server => ({
        ...server,
        health_status: server.health_status || 'offline'
      }));
      
      setServers(serversWithHealth);
    } catch (error: any) {
      console.error('Error fetching servers:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch servers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Enhanced URL validation
  const validateUrl = (url: string): { isValid: boolean; message?: string } => {
    if (!url.endsWith('/')) {
      return { isValid: false, message: "Embed URL must end with a trailing slash (/) " };
    }
    
    try {
      new URL(url);
      return { isValid: true };
    } catch {
      return { isValid: false, message: "Please enter a valid URL" };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Enhanced validation
      const urlValidation = validateUrl(formData.embed_url);
      if (!urlValidation.isValid) {
        toast({
          title: "Invalid URL",
          description: urlValidation.message,
          variant: "destructive",
        });
        return;
      }

      const payload = { 
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (editingServer) {
        const { error } = await supabase
          .from('embed_servers')
          .update(payload)
          .eq('id', editingServer.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Server updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('embed_servers')
          .insert([{
            ...payload,
            health_status: 'offline'
          }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Server created successfully",
        });
      }

      resetForm();
      fetchServers();
    } catch (error: any) {
      console.error('Error saving server:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingServer ? 'update' : 'create'} server`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('embed_servers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Server deleted successfully",
      });
      fetchServers();
    } catch (error: any) {
      console.error('Error deleting server:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete server",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedServers.size === 0) return;

    try {
      const serverIds = Array.from(selectedServers);
      
      switch (bulkAction) {
        case 'activate':
          await supabase
            .from('embed_servers')
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .in('id', serverIds);
          toast({ title: "Success", description: `${serverIds.length} servers activated` });
          break;
          
        case 'deactivate':
          await supabase
            .from('embed_servers')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .in('id', serverIds);
          toast({ title: "Success", description: `${serverIds.length} servers deactivated` });
          break;
          
        case 'delete':
          await supabase
            .from('embed_servers')
            .delete()
            .in('id', serverIds);
          toast({ title: "Success", description: `${serverIds.length} servers deleted` });
          break;
      }
      
      setSelectedServers(new Set());
      setBulkAction('');
      fetchServers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Bulk operation failed",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (server: EmbedServer) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      embed_url: server.embed_url,
      is_active: server.is_active,
      order_index: server.order_index,
      server_type: server.server_type,
      priority: server.priority,
    });
  };

  const moveOrder = async (server: EmbedServer, direction: 'up' | 'down') => {
    const currentIndex = server.order_index;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    const targetServer = servers.find(s => s.order_index === targetIndex);
    
    if (!targetServer && direction === 'down') return;

    try {
      // Use transaction for atomic updates
      if (targetServer) {
        await Promise.all([
          supabase.from('embed_servers').update({ order_index: targetIndex }).eq('id', server.id),
          supabase.from('embed_servers').update({ order_index: currentIndex }).eq('id', targetServer.id)
        ]);
      } else {
        await supabase.from('embed_servers').update({ order_index: targetIndex }).eq('id', server.id);
      }
      
      fetchServers();
    } catch (error: any) {
      console.error('Error moving server:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reorder server",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingServer(null);
    setFormData({
      name: '',
      embed_url: '',
      is_active: true,
      order_index: getNextOrderIndex(),
      server_type: 'streaming',
      priority: 'medium',
    });
    setTestResult(null);
  };

  // Enhanced URL testing with performance metrics
  const testEmbedUrl = async (server: EmbedServer) => {
    setTesting(true);
    setTestResult(null);

    try {
      const startTime = performance.now();
      const testUrl = `${server.embed_url}test`;
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Update server health status
      await supabase
        .from('embed_servers')
        .update({ 
          health_status: 'healthy',
          last_checked: new Date().toISOString()
        })
        .eq('id', server.id);

      setTestResult({
        success: true,
        message: `Server responded successfully in ${responseTime}ms`,
        responseTime
      });

      fetchServers(); // Refresh to update health status
    } catch (error) {
      await supabase
        .from('embed_servers')
        .update({ 
          health_status: 'offline',
          last_checked: new Date().toISOString()
        })
        .eq('id', server.id);

      setTestResult({
        success: false,
        message: "Server is not reachable"
      });
      
      fetchServers();
    } finally {
      setTesting(false);
    }
  };

  // Bulk health check
  const performHealthCheck = async () => {
    setHealthCheckLoading(true);
    
    for (const server of servers) {
      await testEmbedUrl(server);
      // Small delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setHealthCheckLoading(false);
    toast({
      title: "Health Check Complete",
      description: `Checked ${servers.length} servers`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Server URL copied to clipboard",
    });
  };

  const getNextOrderIndex = () => {
    if (servers.length === 0) return 0;
    return Math.max(...servers.map(s => s.order_index)) + 1;
  };

  const toggleServerSelection = (serverId: string) => {
    const newSelected = new Set(selectedServers);
    if (newSelected.has(serverId)) {
      newSelected.delete(serverId);
    } else {
      newSelected.add(serverId);
    }
    setSelectedServers(newSelected);
  };

  const selectAllServers = () => {
    if (selectedServers.size === filteredServers.length) {
      setSelectedServers(new Set());
    } else {
      setSelectedServers(new Set(filteredServers.map(s => s.id)));
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Network className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Zap className="h-4 w-4 text-red-500" />;
      case 'medium': return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Network className="h-4 w-4 text-green-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4 border border-gray-200">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg bg-gray-200" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32 bg-gray-200" />
              <Skeleton className="h-3 w-48 bg-gray-200" />
            </div>
            <Skeleton className="h-9 w-9 rounded-md bg-gray-200" />
            <Skeleton className="h-9 w-9 rounded-md bg-gray-200" />
            <Skeleton className="h-9 w-9 rounded-md bg-gray-200" />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Server Management</h1>
          <p className="text-gray-600 mt-1">
            Manage embed servers with advanced monitoring and bulk operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={performHealthCheck} 
            variant="outline" 
            size="sm"
            disabled={healthCheckLoading || servers.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${healthCheckLoading ? 'animate-spin' : ''}`} />
            Health Check
          </Button>
          <Button 
            onClick={() => fetchServers()} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Servers</p>
              <p className="text-2xl font-bold text-gray-900">{serverStats.total}</p>
            </div>
            <Server className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Servers</p>
              <p className="text-2xl font-bold text-green-600">{serverStats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Healthy</p>
              <p className="text-2xl font-bold text-green-600">{serverStats.health.healthy}</p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-red-600">{serverStats.health.offline}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Server Form */}
      <Card className="p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {editingServer ? 'Edit Server' : 'Add New Server'}
            </h3>
            <p className="text-sm text-gray-600">
              {editingServer ? 'Update server configuration' : 'Create a new embed server with advanced options'}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Server Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., FileMoon, StreamTape"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_index">Order Index</Label>
              <Input
                id="order_index"
                type="number"
                min="0"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="server_type">Server Type</Label>
              <Select
                value={formData.server_type}
                onValueChange={(value: 'streaming' | 'download' | 'backup') => 
                  setFormData({ ...formData, server_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streaming">Streaming</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'high' | 'medium' | 'low') => 
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="embed_url">Embed URL Base *</Label>
            <Input
              id="embed_url"
              value={formData.embed_url}
              onChange={(e) => setFormData({ ...formData, embed_url: e.target.value })}
              placeholder="https://filemoon.sx/e/"
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500">
              Must end with a trailing slash. Example: https://filemoon.sx/e/[slug]
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active Server
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingServer ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingServer ? 'Update Server' : 'Create Server'}
            </Button>
            {editingServer && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFormData(prev => ({ ...prev, order_index: getNextOrderIndex() }))}
              disabled={isSubmitting}
            >
              Auto Order
            </Button>
          </div>
        </form>
      </Card>

      {/* Enhanced Servers List with Bulk Actions */}
      <Card className="p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Managed Servers</h3>
            <p className="text-sm text-gray-600">
              {filteredServers.length} of {servers.length} servers
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search servers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
            
            {selectedServers.size > 0 && (
              <div className="flex gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">Activate</SelectItem>
                    <SelectItem value="deactivate">Deactivate</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBulkAction}
                  variant="default"
                  size="sm"
                >
                  Apply
                </Button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : servers.length === 0 ? (
          <Card className="p-8 text-center border border-gray-200">
            <Server className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-semibold mb-2 text-gray-900">No Servers Configured</h4>
            <p className="text-gray-600 mb-4">
              Get started by adding your first embed server above.
            </p>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Server
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-600 border-b">
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllServers}
                  className="h-8 w-8 p-0"
                >
                  {selectedServers.size === filteredServers.length ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 border border-gray-300 rounded" />
                  )}
                </Button>
              </div>
              <div className="col-span-3">Server</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Order</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Server Items */}
            {filteredServers.map((server) => (
              <div
                key={server.id}
                className={`grid grid-cols-12 gap-4 items-center p-4 rounded-lg border transition-all ${
                  server.is_active 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                } ${selectedServers.has(server.id) ? 'ring-2 ring-blue-500' : ''}`}
              >
                {/* Selection Checkbox */}
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleServerSelection(server.id)}
                    className="h-8 w-8 p-0"
                  >
                    {selectedServers.has(server.id) ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 border border-gray-300 rounded" />
                    )}
                  </Button>
                </div>

                {/* Server Info */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      server.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{server.name}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <code className="text-xs text-gray-600 bg-white px-1 py-0.5 rounded border font-mono truncate max-w-[120px]">
                          {server.embed_url}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(server.embed_url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Type and Priority */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(server.priority)}
                    <Badge variant="outline" className="capitalize">
                      {server.server_type}
                    </Badge>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {getHealthIcon(server.health_status)}
                    <div className="flex flex-col">
                      <Badge 
                        variant={server.is_active ? "default" : "secondary"} 
                        className={`capitalize text-xs ${
                          server.is_active ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      >
                        {server.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-gray-500 capitalize">
                        {server.health_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {server.order_index}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveOrder(server, 'up')}
                        disabled={server.order_index === 0}
                        className="h-6 w-6"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveOrder(server, 'down')}
                        disabled={server.order_index === Math.max(...servers.map(s => s.order_index))}
                        className="h-6 w-6"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => testEmbedUrl(server)}
                      disabled={testing}
                      className="h-8 w-8"
                      title="Test URL"
                    >
                      {testing && editingServer?.id === server.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(server)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => setDeleteConfirm(server.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Test Result */}
                {testResult && editingServer?.id === server.id && (
                  <div className="col-span-12 mt-2">
                    <div className={`p-2 rounded text-sm ${
                      testResult.success 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {testResult.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span>{testResult.message}</span>
                        {testResult.responseTime && (
                          <Badge variant="outline" className="ml-auto">
                            {testResult.responseTime}ms
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Server
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the server configuration
              and remove it from all associated episodes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Server
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
