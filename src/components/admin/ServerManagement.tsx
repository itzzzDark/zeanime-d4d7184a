import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Server, ArrowUp, ArrowDown } from 'lucide-react';

interface EmbedServer {
  id: string;
  name: string;
  embed_url: string;
  is_active: boolean;
  order_index: number;
}

export default function ServerManagement() {
  const [servers, setServers] = useState<EmbedServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingServer, setEditingServer] = useState<EmbedServer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    embed_url: '',
    is_active: true,
    order_index: 0,
  });

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('embed_servers')
      .select('*')
      .order('order_index');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch servers",
        variant: "destructive",
      });
    } else {
      setServers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingServer) {
      const { error } = await supabase
        .from('embed_servers')
        .update(formData)
        .eq('id', editingServer.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update server",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Server updated successfully",
        });
        resetForm();
        fetchServers();
      }
    } else {
      const { error } = await supabase
        .from('embed_servers')
        .insert([formData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create server",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Server created successfully",
        });
        resetForm();
        fetchServers();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this server?')) return;

    const { error } = await supabase
      .from('embed_servers')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete server",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Server deleted successfully",
      });
      fetchServers();
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
    
    if (targetServer) {
      await supabase.from('embed_servers').update({ order_index: targetIndex }).eq('id', server.id);
      await supabase.from('embed_servers').update({ order_index: currentIndex }).eq('id', targetServer.id);
    } else {
      await supabase.from('embed_servers').update({ order_index: targetIndex }).eq('id', server.id);
    }
    
    fetchServers();
  };

  const resetForm = () => {
    setEditingServer(null);
    setFormData({
      name: '',
      embed_url: '',
      is_active: true,
      order_index: 0,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4">
          {editingServer ? 'Edit Server' : 'Create New Server'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Server Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Server 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="embed_url">Embed URL</Label>
              <Input
                id="embed_url"
                value={formData.embed_url}
                onChange={(e) => setFormData({ ...formData, embed_url: e.target.value })}
                placeholder="e.g., https://example.com/embed/"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_index">Order Index</Label>
              <Input
                id="order_index"
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="gap-2">
              {editingServer ? (
                <>
                  <Pencil className="h-4 w-4" />
                  Update Server
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Server
                </>
              )}
            </Button>
            {editingServer && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Existing Servers</h3>
        {servers.length === 0 ? (
          <Card className="p-8 text-center border-border/50 bg-card/50 backdrop-blur-sm">
            <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No servers yet. Create your first server above.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {servers.map((server) => (
              <Card key={server.id} className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <Server className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{server.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">{server.embed_url}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Order: {server.order_index}</span>
                      {server.is_active ? (
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded">Active</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 rounded">Inactive</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => moveOrder(server, 'up')}
                      disabled={server.order_index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => moveOrder(server, 'down')}
                    >
                      <ArrowDown className="h-4 w-4" />
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
                      onClick={() => handleDelete(server.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}