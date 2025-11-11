import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  anime_id: string | null;
  is_active: boolean;
  order_index: number;
}

interface Anime {
  id: string;
  title: string;
}

export default function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    anime_id: '',
    is_active: true,
    order_index: 0,
  });

  useEffect(() => {
    fetchBanners();
    fetchAnimeList();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('order_index');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch banners",
        variant: "destructive",
      });
    } else {
      setBanners(data || []);
    }
    setLoading(false);
  };

  const fetchAnimeList = async () => {
    const { data } = await supabase
      .from('anime')
      .select('id, title')
      .order('title');
    
    if (data) {
      setAnimeList(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bannerData = {
      ...formData,
      anime_id: formData.anime_id || null,
    };

    if (editingBanner) {
      const { error } = await supabase
        .from('banners')
        .update(bannerData)
        .eq('id', editingBanner.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update banner",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Banner updated successfully",
        });
        resetForm();
        fetchBanners();
      }
    } else {
      const { error } = await supabase
        .from('banners')
        .insert([bannerData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create banner",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Banner created successfully",
        });
        resetForm();
        fetchBanners();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete banner",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Banner deleted successfully",
      });
      fetchBanners();
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url,
      anime_id: banner.anime_id || '',
      is_active: banner.is_active,
      order_index: banner.order_index,
    });
  };

  const moveOrder = async (banner: Banner, direction: 'up' | 'down') => {
    const currentIndex = banner.order_index;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Find the banner at target position
    const targetBanner = banners.find(b => b.order_index === targetIndex);
    
    if (targetBanner) {
      // Swap orders
      await supabase.from('banners').update({ order_index: targetIndex }).eq('id', banner.id);
      await supabase.from('banners').update({ order_index: currentIndex }).eq('id', targetBanner.id);
    } else {
      // Just move
      await supabase.from('banners').update({ order_index: targetIndex }).eq('id', banner.id);
    }
    
    fetchBanners();
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      anime_id: '',
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

  const stats = {
    total: banners.length,
    active: banners.filter(b => b.is_active).length,
    inactive: banners.filter(b => !b.is_active).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Banners</p>
              <h3 className="text-3xl font-bold text-gradient">{stats.total}</h3>
            </div>
            <ImageIcon className="h-12 w-12 text-primary/50" />
          </div>
        </Card>
        <Card className="p-6 border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <h3 className="text-3xl font-bold text-green-400">{stats.active}</h3>
            </div>
            <Eye className="h-12 w-12 text-green-500/50" />
          </div>
        </Card>
        <Card className="p-6 border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <h3 className="text-3xl font-bold text-red-400">{stats.inactive}</h3>
            </div>
            <EyeOff className="h-12 w-12 text-red-500/50" />
          </div>
        </Card>
      </div>

      <Card className="p-6 border-primary/20 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold text-gradient">
            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anime">Linked Anime (Optional)</Label>
              <Select
                value={formData.anime_id}
                onValueChange={(value) => setFormData({ ...formData, anime_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select anime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {animeList.map((anime) => (
                    <SelectItem key={anime.id} value={anime.id}>
                      {anime.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              required
            />
            {formData.image_url && (
              <div className="mt-2 border border-border/50 rounded-lg overflow-hidden">
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            )}
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
              {editingBanner ? (
                <>
                  <Pencil className="h-4 w-4" />
                  Update Banner
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Banner
                </>
              )}
            </Button>
            {editingBanner && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Banners</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({stats.inactive})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {banners.length === 0 ? (
            <Card className="p-12 text-center border-primary/20 bg-gradient-to-br from-card/50 to-transparent backdrop-blur-sm">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-primary/50" />
              <h4 className="text-lg font-semibold mb-2">No banners yet</h4>
              <p className="text-muted-foreground">Create your first banner to get started.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {banners.map((banner, index) => (
                <Card key={banner.id} className="group overflow-hidden border-primary/20 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm hover:border-primary/40 transition-all">
                  <div className="flex items-center gap-4 p-4">
                    <div className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute bottom-2 left-2 bg-black/80">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-lg line-clamp-1">{banner.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={banner.is_active ? "default" : "secondary"} className="shrink-0">
                            {banner.is_active ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                            {banner.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      {banner.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{banner.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" />
                          Order: {banner.order_index}
                        </span>
                        {banner.anime_id && (
                          <Badge variant="outline" className="text-xs">
                            Linked to Anime
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveOrder(banner, 'up')}
                          disabled={banner.order_index === 0}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveOrder(banner, 'down')}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(banner)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(banner.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {banners.filter(b => b.is_active).map((banner, index) => (
              <Card key={banner.id} className="group overflow-hidden border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent backdrop-blur-sm hover:border-green-500/40 transition-all">
                <div className="flex items-center gap-4 p-4">
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden">
                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                    <Badge className="absolute bottom-2 left-2 bg-green-500">
                      Active #{index + 1}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{banner.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">{banner.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {banners.filter(b => !b.is_active).map((banner) => (
              <Card key={banner.id} className="group overflow-hidden border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent backdrop-blur-sm opacity-60">
                <div className="flex items-center gap-4 p-4">
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden">
                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover grayscale" />
                    <Badge className="absolute bottom-2 left-2 bg-red-500">
                      Inactive
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{banner.title}</h4>
                    <p className="text-sm text-muted-foreground">{banner.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
