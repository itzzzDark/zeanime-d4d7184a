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
import {
  Loader2, Plus, Pencil, Trash2, Image as ImageIcon,
  ArrowUp, ArrowDown, Eye, EyeOff, Sparkles
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
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
  const [saving, setSaving] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    anime_id: '',
    is_active: true,
    order_index: 0,
  });

  // Fetch banners and anime list once
  useEffect(() => {
    (async () => {
      await Promise.all([fetchBanners(), fetchAnimeList()]);
    })();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({ title: 'Error', description: 'Failed to fetch banners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnimeList = async () => {
    try {
      const { data, error } = await supabase
        .from('anime')
        .select('id, title')
        .order('title', { ascending: true });

      if (error) throw error;
      setAnimeList(data || []);
    } catch (error) {
      console.error('Error fetching anime list:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      const bannerData = {
        ...formData,
        anime_id: formData.anime_id || null,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);
        if (error) throw error;

        toast({ title: 'Updated', description: 'Banner updated successfully' });
      } else {
        const { error } = await supabase.from('banners').insert([bannerData]);
        if (error) throw error;

        toast({ title: 'Created', description: 'Banner created successfully' });
      }

      resetForm();
      await fetchBanners();
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save banner', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Banner deleted successfully' });
      await fetchBanners();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete banner', variant: 'destructive' });
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
    const targetBanner = banners.find(b => b.order_index === targetIndex);
    if (!targetBanner) return;

    try {
      await supabase.from('banners').upsert([
        { id: banner.id, order_index: targetIndex },
        { id: targetBanner.id, order_index: currentIndex },
      ]);

      toast({
        title: 'Order Updated',
        description: `Moved ${banner.title} ${direction === 'up' ? 'up' : 'down'}`,
      });

      await fetchBanners();
    } catch (error) {
      console.error('Order update error:', error);
      toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' });
    }
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

  const stats = {
    total: banners.length,
    active: banners.filter(b => b.is_active).length,
    inactive: banners.filter(b => !b.is_active).length,
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Banners', value: stats.total, icon: ImageIcon, color: 'primary' },
          { label: 'Active', value: stats.active, icon: Eye, color: 'green' },
          { label: 'Inactive', value: stats.inactive, icon: EyeOff, color: 'red' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <Card key={i} className={`p-6 border-${color}-500/20 bg-gradient-to-br from-${color}-500/10`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <h3 className="text-3xl font-bold">{value}</h3>
              </div>
              <Icon className={`h-10 w-10 text-${color}-400`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Form */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">
            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Linked Anime</Label>
              <Select
                value={formData.anime_id}
                onValueChange={value => setFormData({ ...formData, anime_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select anime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {animeList.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Image URL</Label>
            <Input
              type="url"
              value={formData.image_url}
              onChange={e => setFormData({ ...formData, image_url: e.target.value })}
              required
            />
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Banner Preview"
                className="mt-2 w-full h-40 object-cover rounded-lg border"
                onError={e => (e.currentTarget.src = '/placeholder.svg')}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <Label>Order Index</Label>
              <Input
                type="number"
                value={formData.order_index}
                onChange={e =>
                  setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch
                checked={formData.is_active}
                onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : editingBanner ? (
                <>
                  <Pencil className="h-4 w-4" /> Update
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Create
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

      {/* Banner List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({stats.inactive})</TabsTrigger>
        </TabsList>

        {['all', 'active', 'inactive'].map((tab) => {
          const filtered =
            tab === 'active'
              ? banners.filter(b => b.is_active)
              : tab === 'inactive'
              ? banners.filter(b => !b.is_active)
              : banners;

          return (
            <TabsContent key={tab} value={tab} className="space-y-4 mt-6">
              {filtered.length === 0 ? (
                <Card className="p-12 text-center">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted" />
                  <h4 className="text-lg font-semibold mb-2">No {tab} banners</h4>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filtered.map((banner) => (
                    <Card
                      key={banner.id}
                      className="flex items-center justify-between p-4 border hover:border-primary/40 transition"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-24 h-16 rounded object-cover"
                        />
                        <div>
                          <h4 className="font-semibold">{banner.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {banner.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveOrder(banner, 'up')}
                          disabled={banner.order_index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveOrder(banner, 'down')}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(banner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
