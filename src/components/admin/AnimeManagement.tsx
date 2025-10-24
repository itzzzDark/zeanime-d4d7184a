import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AnimeManagement({ onUpdate }: { onUpdate: () => void }) {
  const [anime, setAnime] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cover_image: '',
    banner_image: '',
    type: 'series',
    status: 'ongoing',
    genres: '',
    release_year: new Date().getFullYear(),
    studio: '',
    total_episodes: 0,
    rating: 0,
    is_trending: false,
    is_most_watched: false,
  });

  useEffect(() => {
    fetchAnime();
  }, []);

  const fetchAnime = async () => {
    const { data } = await supabase
      .from('anime')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setAnime(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const genres = formData.genres.split(',').map(g => g.trim()).filter(Boolean);
    
    const animeData = {
      title: formData.title,
      description: formData.description,
      cover_image: formData.cover_image,
      banner_image: formData.banner_image,
      type: formData.type as 'series' | 'movie' | 'ova' | 'special',
      status: formData.status as 'ongoing' | 'completed' | 'upcoming',
      genres,
      release_year: formData.release_year,
      studio: formData.studio,
      total_episodes: formData.total_episodes,
      rating: formData.rating,
      is_trending: formData.is_trending,
      is_most_watched: formData.is_most_watched,
    };

    if (editingId) {
      const { error } = await supabase
        .from('anime')
        .update(animeData)
        .eq('id', editingId);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Anime updated successfully" });
    } else {
      const { error } = await supabase
        .from('anime')
        .insert([animeData]);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Anime added successfully" });
    }

    setOpen(false);
    setEditingId(null);
    resetForm();
    fetchAnime();
    onUpdate();
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      cover_image: item.cover_image || '',
      banner_image: item.banner_image || '',
      type: item.type,
      status: item.status,
      genres: item.genres?.join(', ') || '',
      release_year: item.release_year || new Date().getFullYear(),
      studio: item.studio || '',
      total_episodes: item.total_episodes || 0,
      rating: item.rating || 0,
      is_trending: item.is_trending || false,
      is_most_watched: item.is_most_watched || false,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this anime?')) return;
    
    const { error } = await supabase
      .from('anime')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    
    toast({ title: "Success", description: "Anime deleted successfully" });
    fetchAnime();
    onUpdate();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      cover_image: '',
      banner_image: '',
      type: 'series',
      status: 'ongoing',
      genres: '',
      release_year: new Date().getFullYear(),
      studio: '',
      total_episodes: 0,
      rating: 0,
      is_trending: false,
      is_most_watched: false,
    });
  };

  return (
    <Card className="p-6 border-border/50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Anime Management</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingId(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Anime
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Anime' : 'Add New Anime'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studio">Studio</Label>
                  <Input
                    id="studio"
                    value={formData.studio}
                    onChange={(e) => setFormData({ ...formData, studio: e.target.value })}
                  />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cover_image">Cover Image URL</Label>
                  <Input
                    id="cover_image"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner_image">Banner Image URL</Label>
                  <Input
                    id="banner_image"
                    value={formData.banner_image}
                    onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="series">Series</SelectItem>
                      <SelectItem value="movie">Movie</SelectItem>
                      <SelectItem value="ova">OVA</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="release_year">Release Year</Label>
                  <Input
                    id="release_year"
                    type="number"
                    value={formData.release_year}
                    onChange={(e) => setFormData({ ...formData, release_year: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_episodes">Total Episodes</Label>
                  <Input
                    id="total_episodes"
                    type="number"
                    value={formData.total_episodes}
                    onChange={(e) => setFormData({ ...formData, total_episodes: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    max="10"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="genres">Genres (comma separated)</Label>
                <Input
                  id="genres"
                  value={formData.genres}
                  onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                  placeholder="Action, Adventure, Fantasy"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_trending}
                    onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                  />
                  Trending
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_most_watched}
                    onChange={(e) => setFormData({ ...formData, is_most_watched: e.target.checked })}
                  />
                  Most Watched
                </label>
              </div>

              <Button type="submit" className="w-full">
                {editingId ? 'Update Anime' : 'Add Anime'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Episodes</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {anime.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.status}</TableCell>
              <TableCell>{item.total_episodes}</TableCell>
              <TableCell>{item.rating}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}