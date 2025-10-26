import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function EpisodeManagement() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [anime, setAnime] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    anime_id: '',
    season_number: 1,
    episode_number: 1,
    title: '',
    description: '',
    video_url: '',
    thumbnail: '',
    duration: 0,
  });

  useEffect(() => {
    fetchEpisodes();
    fetchAnime();
  }, []);

  const fetchEpisodes = async () => {
    const { data } = await supabase
      .from('episodes')
      .select('*, anime(title)')
      .order('anime_id', { ascending: true })
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true });
    
    if (data) setEpisodes(data);
  };

  const fetchAnime = async () => {
    const { data } = await supabase
      .from('anime')
      .select('id, title')
      .order('title');
    
    if (data) setAnime(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from('episodes')
        .update(formData)
        .eq('id', editingId);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Episode updated successfully" });
    } else {
      const { error } = await supabase
        .from('episodes')
        .insert([formData]);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Episode added successfully" });
    }

    setOpen(false);
    setEditingId(null);
    resetForm();
    fetchEpisodes();
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      anime_id: item.anime_id,
      season_number: item.season_number || 1,
      episode_number: item.episode_number,
      title: item.title || '',
      description: item.description || '',
      video_url: item.video_url,
      thumbnail: item.thumbnail || '',
      duration: item.duration || 0,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    
    const { error } = await supabase
      .from('episodes')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    
    toast({ title: "Success", description: "Episode deleted successfully" });
    fetchEpisodes();
  };

  const resetForm = () => {
    setFormData({
      anime_id: '',
      season_number: 1,
      episode_number: 1,
      title: '',
      description: '',
      video_url: '',
      thumbnail: '',
      duration: 0,
    });
  };

  return (
    <Card className="p-6 border-border/50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Episode Management</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingId(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Episode
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Episode' : 'Add New Episode'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anime_id">Anime *</Label>
                <Select value={formData.anime_id} onValueChange={(value) => setFormData({ ...formData, anime_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select anime" />
                  </SelectTrigger>
                  <SelectContent>
                    {anime.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="season_number">Season *</Label>
                  <Input
                    id="season_number"
                    type="number"
                    min="1"
                    value={formData.season_number}
                    onChange={(e) => setFormData({ ...formData, season_number: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="episode_number">Episode Number *</Label>
                  <Input
                    id="episode_number"
                    type="number"
                    min="1"
                    value={formData.episode_number}
                    onChange={(e) => setFormData({ ...formData, episode_number: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
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
                <Label htmlFor="video_url">Video URL *</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingId ? 'Update Episode' : 'Add Episode'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
              <TableHead>Anime</TableHead>
              <TableHead>Season</TableHead>
              <TableHead>Episode</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {episodes.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.anime?.title}</TableCell>
              <TableCell><Badge variant="outline">{item.season_number || 1}</Badge></TableCell>
              <TableCell>Episode {item.episode_number}</TableCell>
              <TableCell>{item.title || '-'}</TableCell>
              <TableCell>{item.duration || '-'} min</TableCell>
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