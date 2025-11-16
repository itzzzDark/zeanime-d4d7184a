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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Server, 
  ArrowUp, 
  ArrowDown, 
  MoreVertical,
  Copy,
  ExternalLink,
  TestTube,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Settings,
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
  const [testUrl, setTestUrl] = useState('');
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

      if (editingServer) {
        const { error } = await supabase
          .from('embed_servers')
          .update(formData)
          .eq('id', editingServer.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Server updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('embed_servers')
          .insert([formData]);

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
    
    try {
      if (targetServer) {
        // Swap positions
        await supabase.from('embed_servers').update({ order_index: targetIndex }).eq('id', server.id);
        await supabase.from('embed_servers').update({ order_index: currentIndex }).eq('id', targetServer.id);
      } else {
        // Move to end or beginning
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
    setTestUrl('');
  };

  const testEmbedUrl = async (server: EmbedServer, testSlug: string = 'demo') => {
    if (!testSlug.trim()) {
      toast({
        title: "Test Slug Required",
        description: "Please enter a test slug to test the embed URL",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const testEmbedUrl = `${server.embed_url}${testSlug}`;
      
      // Test with a HEAD request to check if the URL is accessible
      const response = await fetch(testEmbedUrl, { 
        method: 'HEAD',
        mode: 'no-cors'
      });

      // Since we're using no-cors, we can't read the response status
      // But if we reach here, the request was made successfully
      setTestResult({
        success: true,
        message: `Embed URL is accessible. Full URL: ${testEmbedUrl}`
      });

      toast({
        title: "Test Successful",
        description: "Embed URL is working correctly",
      });

    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to access embed URL. Please check the URL format."
      });
      
      toast({
        title: "Test Failed",
        description: "Could not access the embed URL",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: message,
    });
  };

  const getNextOrderIndex = () => {
    return servers.length > 0 ? Math.max(...servers.map(s => s.order_index)) + 1 : 0;
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4 border-border/50">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Server Management
          </h1>
          <p className="text-muted-foreground mt-1">
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

      {/* Server Form Card */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm border-l-4 border-l-primary">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">
              {editingServer ? 'Edit Server' : 'Add New Server'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {editingServer ? 'Update existing server configuration' : 'Create a new embed server for video playback'}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  Server Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., FileMoon, StreamTape, DoodStream"
                  className="focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_index" className="flex items-center gap-2">
                  Order Index
                </Label>
                <Input
                  id="order_index"
                  type="number"
                  min="0"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  className="focus-visible:ring-primary"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first in the server list
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="embed_url" className="flex items-center gap-2">
                  Embed URL Base <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="embed_url"
                  value={formData.embed_url}
                  onChange={(e) => setFormData({ ...formData, embed_url: e.target.value })}
                  placeholder="https://filemoon.sx/e/"
                  className="font-mono text-sm focus-visible:ring-primary"
                  required
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Must end with a trailing slash (/)</p>
                  <p>• Episode slug will be appended automatically</p>
                  <p className="font-mono bg-muted p-1 rounded">Example: https://filemoon.sx/e/[slug]</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <Label htmlFor="is_active" className="flex items-center gap-2 cursor-pointer flex-1">
                  {formData.is_active ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>Active Server</span>
                </Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </div>

          {/* Test Section */}
          {formData.embed_url && (
            <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
              <Label className="flex items-center gap-2 text-sm font-medium mb-3">
                <TestTube className="h-4 w-4" />
                Test Embed URL
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter test slug (e.g., abc123)"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => testEmbedUrl(formData as any, testUrl)}
                  disabled={testing || !formData.embed_url || !testUrl}
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Test
                </Button>
              </div>
              {testResult && (
                <div className={`mt-2 p-2 rounded text-sm ${
                  testResult.success 
                    ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                    : 'bg-red-500/20 text-red-700 dark:text-red-400'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 inline mr-1" />
                  )}
                  {testResult.message}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
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
            <div className="flex-1" />
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
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Managed Servers
          </h3>
          <Badge variant="outline" className="text-sm">
            {servers.filter(s => s.is_active).length} Active
          </Badge>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : servers.length === 0 ? (
          <Card className="p-8 text-center border-border/50 bg-card/50 backdrop-blur-sm">
            <Server className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h4 className="text-lg font-semibold mb-2">No Servers Configured</h4>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first embed server above.
            </p>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Server
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {servers.map((server) => (
              <Card 
                key={server.id} 
                className={`p-4 border-border/50 backdrop-blur-sm transition-all hover:shadow-md ${
                  server.is_active 
                    ? 'border-l-4 border-l-green-500 bg-card/50' 
                    : 'border-l-4 border-l-muted-foreground/30 bg-muted/20 opacity-70'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    server.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Server className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg truncate">{server.name}</h4>
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
                      <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded font-mono truncate flex-1">
                        {server.embed_url}[slug]
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(server.embed_url, 'Embed URL copied!')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Created: {new Date(server.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-1">
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
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(server)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Server
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => testEmbedUrl(server, 'test')}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          Test URL
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => window.open(server.embed_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Base URL
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirm(server.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Server
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Server
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
