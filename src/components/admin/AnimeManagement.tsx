import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Filter, 
  SortAsc, 
  Image,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Anime {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  banner_image?: string;
  type: 'series' | 'movie' | 'ova' | 'special';
  status: 'ongoing' | 'completed' | 'upcoming';
  genres: string[];
  release_year: number;
  studio?: string;
  total_episodes: number;
  rating: number;
  is_trending: boolean;
  is_most_watched: boolean;
  slug: string;
  created_at: string;
}

interface AnimeFormData {
  title: string;
  description: string;
  cover_image: string;
  banner_image: string;
  type: 'series' | 'movie' | 'ova' | 'special';
  status: 'ongoing' | 'completed' | 'upcoming';
  genres: string;
  release_year: number;
  studio: string;
  total_episodes: number;
  rating: number;
  is_trending: boolean;
  is_most_watched: boolean;
}

export default function AnimeManagement({ onUpdate }: { onUpdate: () => void }) {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [filteredAnime, setFilteredAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [imagePreview, setImagePreview] = useState({ cover: '', banner: '' });

  const [formData, setFormData] = useState<AnimeFormData>({
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

  // Fetch anime with error handling
  const fetchAnime = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anime')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnime(data || []);
    } catch (error: any) {
      console.error('Error fetching anime:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch anime",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnime();
  }, [fetchAnime]);

  // Filter and sort anime
  useEffect(() => {
    let result = [...anime];

    // Search filter
    if (searchTerm) {
      result = result.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genres.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(item => item.type === typeFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Anime];
      let bValue: any = b[sortBy as keyof Anime];

      if (sortBy === 'rating') {
        aValue = a.rating || 0;
        bValue = b.rating || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAnime(result);
  }, [anime, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const genres = formData.genres.split(',').map(g => g.trim()).filter(Boolean);
      
      const animeData = {
        title: formData.title,
        description: formData.description,
        cover_image: formData.cover_image,
        banner_image: formData.banner_image,
        type: formData.type,
        status: formData.status,
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
        
        if (error) throw error;
        toast({ title: "Success", description: "Anime updated successfully" });
      } else {
        const { error } = await supabase
          .from('anime')
          .insert([animeData]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Anime added successfully" });
      }

      setOpen(false);
      setEditingId(null);
      resetForm();
      fetchAnime();
      onUpdate();
    } catch (error: any) {
      console.error('Error saving anime:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save anime",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: Anime) => {
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
    setImagePreview({
      cover: item.cover_image || '',
      banner: item.banner_image || ''
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this anime? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('anime')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: "Success", description: "Anime deleted successfully" });
      fetchAnime();
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting anime:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete anime",
        variant: "destructive"
      });
    }
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
    setImagePreview({ cover: '', banner: '' });
  };

  const handleImageUrlChange = (field: 'cover_image' | 'banner_image', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setImagePreview(prev => ({
      ...prev,
      [field === 'cover_image' ? 'cover' : 'banner']: value
    }));
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'series': return 'bg-purple-500';
      case 'movie': return 'bg-red-500';
      case 'ova': return 'bg-orange-500';
      case 'special': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );

  return (
    <Card className="p-6 border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Anime Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your anime library ({filteredAnime.length} items)
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingId(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Anime
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingId ? (
                  <>
                    <Pencil className="h-5 w-5" />
                    Edit Anime
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Add New Anime
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter anime title"
                      required
                      className="focus-visible:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="studio">Studio</Label>
                    <Input
                      id="studio"
                      value={formData.studio}
                      onChange={(e) => setFormData({ ...formData, studio: e.target.value })}
                      placeholder="Production studio"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      placeholder="Brief description of the anime"
                      className="resize-none focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genres">Genres</Label>
                    <Input
                      id="genres"
                      value={formData.genres}
                      onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                      placeholder="Action, Adventure, Fantasy, Romance..."
                      className="focus-visible:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple genres with commas
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total_episodes">Total Episodes</Label>
                      <Input
                        id="total_episodes"
                        type="number"
                        min="0"
                        value={formData.total_episodes}
                        onChange={(e) => setFormData({ ...formData, total_episodes: parseInt(e.target.value) || 0 })}
                        className="focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                        className="focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Media & Metadata */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cover_image" className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Cover Image URL
                      </Label>
                      <Input
                        id="cover_image"
                        value={formData.cover_image}
                        onChange={(e) => handleImageUrlChange('cover_image', e.target.value)}
                        placeholder="https://example.com/cover.jpg"
                        className="focus-visible:ring-primary"
                      />
                      {imagePreview.cover && (
                        <div className="mt-2">
                          <Label className="text-xs text-muted-foreground">Preview:</Label>
                          <div className="relative mt-1 border rounded-lg overflow-hidden">
                            <img 
                              src={imagePreview.cover} 
                              alt="Cover preview" 
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0"
                              onClick={() => window.open(imagePreview.cover, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="banner_image" className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Banner Image URL
                      </Label>
                      <Input
                        id="banner_image"
                        value={formData.banner_image}
                        onChange={(e) => handleImageUrlChange('banner_image', e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="focus-visible:ring-primary"
                      />
                      {imagePreview.banner && (
                        <div className="mt-2">
                          <Label className="text-xs text-muted-foreground">Preview:</Label>
                          <div className="relative mt-1 border rounded-lg overflow-hidden">
                            <img 
                              src={imagePreview.banner} 
                              alt="Banner preview" 
                              className="w-full h-20 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0"
                              onClick={() => window.open(imagePreview.banner, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger className="focus-visible:ring-primary">
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
                      <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger className="focus-visible:ring-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="release_year">Release Year</Label>
                    <Input
                      id="release_year"
                      type="number"
                      min="1900"
                      max="2100"
                      value={formData.release_year}
                      onChange={(e) => setFormData({ ...formData, release_year: parseInt(e.target.value) || new Date().getFullYear() })}
                      className="focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Features</Label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="is_trending" className="flex items-center gap-2 cursor-pointer">
                          <Eye className="h-4 w-4" />
                          Trending
                        </Label>
                        <Switch
                          id="is_trending"
                          checked={formData.is_trending}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_trending: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="is_most_watched" className="flex items-center gap-2 cursor-pointer">
                          <EyeOff className="h-4 w-4" />
                          Most Watched
                        </Label>
                        <Switch
                          id="is_most_watched"
                          checked={formData.is_most_watched}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_most_watched: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                {editingId ? 'Update Anime' : 'Add Anime'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search anime, studio, or genres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 focus-visible:ring-primary"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 focus-visible:ring-primary">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 focus-visible:ring-primary">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="series">Series</SelectItem>
              <SelectItem value="movie">Movie</SelectItem>
              <SelectItem value="ova">OVA</SelectItem>
              <SelectItem value="special">Special</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
              setSortBy('created_at');
              setSortOrder('desc');
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Anime Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-2">
                  Title
                  <SortAsc className={`h-4 w-4 transition-transform ${
                    sortBy === 'title' && sortOrder === 'desc' ? 'rotate-180' : ''
                  }`} />
                </div>
              </TableHead>
              <TableHead>Genres</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('type')}
              >
                <div className="flex items-center gap-2">
                  Type
                  <SortAsc className={`h-4 w-4 transition-transform ${
                    sortBy === 'type' && sortOrder === 'desc' ? 'rotate-180' : ''
                  }`} />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  <SortAsc className={`h-4 w-4 transition-transform ${
                    sortBy === 'status' && sortOrder === 'desc' ? 'rotate-180' : ''
                  }`} />
                </div>
              </TableHead>
              <TableHead>Episodes</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('rating')}
              >
                <div className="flex items-center gap-2">
                  Rating
                  <SortAsc className={`h-4 w-4 transition-transform ${
                    sortBy === 'rating' && sortOrder === 'desc' ? 'rotate-180' : ''
                  }`} />
                </div>
              </TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <LoadingSkeleton />
                </TableCell>
              </TableRow>
            ) : filteredAnime.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {anime.length === 0 ? 'No anime found. Add your first anime!' : 'No results match your filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAnime.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.cover_image && (
                        <img 
                          src={item.cover_image} 
                          alt={item.title}
                          className="w-10 h-14 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div className="font-medium line-clamp-1">{item.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {item.studio}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {item.genres.slice(0, 3).map((genre, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                      {item.genres.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.genres.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(item.type)}>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {item.total_episodes || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.rating || 'N/A'}</span>
                      {item.rating >= 8 && (
                        <Badge variant="default" className="bg-green-500 text-xs">
                          Top
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.is_trending && (
                        <Badge variant="secondary" className="bg-orange-500 text-xs">
                          Trending
                        </Badge>
                      )}
                      {item.is_most_watched && (
                        <Badge variant="secondary" className="bg-blue-500 text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
