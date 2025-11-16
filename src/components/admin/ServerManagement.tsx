import { useState, useEffect, useCallback } from 'react';
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
  DialogTrigger 
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
  RefreshCw
} from 'lucide-react';

interface EmbedServer {
  id: string;
  name: string;
  embed_url: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

interface ServerFormData {
  name: string;
  embed_url: string;
  is_active: boolean;
  order_index: number;
}

export default function ServerManagement() {
  const [servers, setServers] = useState<EmbedServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingServer, setEditingServer] = useState<EmbedServer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const [formData, setFormData] = useState<ServerFormData>({
    name: '',
    embed_url: '',
    is_active: true,
    order_index: 0,
  });

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('embed_servers')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setServers(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate URL format
      if (!formData.embed_url.endsWith('/')) {
        toast({
          title: "Invalid URL Format",
          description: "Embed URL must end with a trailing slash (/)",
          variant: "destructive",
        });
        return;
      }

      const payload = { ...formData };

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
          .insert([payload]);

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

  const handleEdit = (server: EmbedServer) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      embed_url: server.embed_url,
      is_active: server.is_active,
      order_index: server.order_index,
    });
  };

  const moveOrder = async (server: EmbedServer, direction: 'up' | 'down') => {
    const currentIndex = server.order_index;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    const targetServer = servers.find(s => s.order_index === targetIndex);
    
    if (!targetServer && direction === 'down') {
      // If moving down and no target, it's already at the bottom
      return;
    }

    try {
      if (targetServer) {
        // Swap positions
        await supabase.from('embed_servers').update({ order_index: targetIndex }).eq('id', server.id);
        await supabase.from('embed_servers').update({ order_index: currentIndex }).eq('id', targetServer.id);
      } else {
        // Move to new position
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
      order_index: servers.length > 0 ? Math.max(...servers.map(s => s.order_index)) + 1 : 0,
    });
    setTestResult(null);
  };

  const testEmbedUrl = async (server: EmbedServer) => {
    setTesting(true);
    setTestResult(null);

    try {
      // Create a test iframe to check if the embed URL works
      const testUrl = `${server.embed_url}test`;
      
      // This is a basic test - in production you might want more sophisticated testing
      const iframe = document.createElement('iframe');
      iframe.src = testUrl;
      iframe.style.display = 'none';
      
      iframe.onload = () => {
        setTestResult({
          success: true,
          message: "Embed URL loaded successfully"
        });
        document.body.removeChild(iframe);
        setTesting(false);
      };
      
      iframe.onerror = () => {
        setTestResult({
          success: false,
          message: "Failed to load embed URL"
        });
        document.body.removeChild(iframe);
        setTesting(false);
      };
      
      document.body.appendChild(iframe);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
          setTestResult({
            success: false,
            message: "Test timed out - URL might be slow or invalid"
          });
          setTesting(false);
        }
      }, 5000);

    } catch (error) {
      setTestResult({
        success: false,
        message: "Error testing URL"
      });
      setTesting(false);
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Server Management</h1>
          <p className="text-gray-600 mt-1">
            Manage embed servers for video playback ({servers.length} servers)
          </p>
        </div>
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

      {/* Server Form */}
      <Card className="p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Server className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {editingServer ? 'Edit Server' : 'Add New Server'}
            </h3>
            <p className="text-sm text-gray-600">
              {editingServer ? 'Update server configuration' : 'Create a new embed server'}
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

      {/* Servers List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Managed Servers</h3>
          <Badge variant="secondary" className="text-sm">
            {servers.filter(s => s.is_active).length} Active
          </Badge>
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
          <div className="space-y-4">
            {servers.map((server) => (
              <Card 
                key={server.id} 
                className={`p-4 border transition-all ${
                  server.is_active 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    server.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Server className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{server.name}</h4>
                      <div className="flex gap-1">
                        <Badge 
                          variant={server.is_active ? "default" : "secondary"} 
                          className={server.is_active ? "bg-green-500" : ""}
                        >
                          {server.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Order: {server.order_index}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-gray-600 bg-white px-2 py-1 rounded border font-mono truncate flex-1">
                        {server.embed_url}[slug]
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(server.embed_url)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => window.open(server.embed_url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => moveOrder(server, 'up')}
                      disabled={server.order_index === 0}
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => moveOrder(server, 'down')}
                      disabled={server.order_index === Math.max(...servers.map(s => s.order_index))}
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => testEmbedUrl(server)}
                      disabled={testing}
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
                      variant="outline"
                      onClick={() => handleEdit(server)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => setDeleteConfirm(server.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Test Result */}
                {testResult && editingServer?.id === server.id && (
                  <div className={`mt-3 p-2 rounded text-sm ${
                    testResult.success 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                    ) : (
                      <XCircle className="h-4 w-4 inline mr-1" />
                    )}
                    {testResult.message}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

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
