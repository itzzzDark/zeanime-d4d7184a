import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4">
          {editingBanner ? 'Edit Banner' : 'Create New Banner'}
        </h3>
        
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

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Existing Banners</h3>
        {banners.length === 0 ? (
          <Card className="p-8 text-center border-border/50 bg-card/50 backdrop-blur-sm">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No banners yet. Create your first banner above.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {banners.map((banner) => (
              <Card key={banner.id} className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{banner.title}</h4>
                    {banner.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{banner.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Order: {banner.order_index}</span>
                      {banner.is_active ? (
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
                      onClick={() => moveOrder(banner, 'up')}
                      disabled={banner.order_index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => moveOrder(banner, 'down')}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(banner)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(banner.id)}
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
