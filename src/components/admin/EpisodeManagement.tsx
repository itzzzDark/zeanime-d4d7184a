import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  SortAsc,
  MoreVertical,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Episode {
  id: string;
  anime_slug: string;
  season_number: number;
  episode_number: number;
  title: string;
  description: string;
  video_url: string;
  server_urls: Record<string, string>;
  thumbnail: string;
  duration: number;
  is_published: boolean;
  created_at: string;
  anime?: {
    title: string;
    slug: string;
    cover_image?: string;
  };
}

interface Anime {
  slug: string;
  title: string;
  cover_image?: string;
}

interface Server {
  id: string;
  name: string;
  embed_url: string;
  is_active: boolean;
  order_index: number;
}

interface EpisodeFormData {
  anime_slug: string;
  season_number: number;
  episode_number: number;
  title: string;
  description: string;
  video_url: string;
  server_urls: Record<string, string>;
  thumbnail: string;
  duration: number;
  is_published: boolean;
}

export default function EpisodeManagement() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [anime, setAnime] = useState<Anime[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ url: string; server: string; type: 'embed' | 'direct' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnime, setFilterAnime] = useState<string>("all");
  const [filterSeason, setFilterSeason] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_desc");
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<EpisodeFormData>({
    anime_slug: "",
    season_number: 1,
    episode_number: 1,
    title: "",
    description: "",
    video_url: "",
    server_urls: {},
    thumbnail: "",
    duration: 0,
    is_published: true,
  });

  // Fetch data with error handling
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch episodes with anime data
      const { data: episodesData, error: episodesError } = await supabase
        .from("episodes")
        .select("*, anime(title, slug, cover_image)")
        .order("created_at", { ascending: false });

      if (episodesError) throw episodesError;
      setEpisodes(episodesData || []);

      // Fetch anime list
      const { data: animeData, error: animeError } = await supabase
        .from("anime")
        .select("slug, title, cover_image")
        .order("title");

      if (animeError) throw animeError;
      setAnime(animeData || []);

      // Fetch servers
      const { data: serversData, error: serversError } = await supabase
        .from("embed_servers")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (serversError) throw serversError;
      setServers(serversData || []);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.anime_slug) {
        toast({
          title: "Missing Required Fields",
          description: "Anime is required.",
          variant: "destructive",
        });
        return;
      }

      const payload = { ...formData };

      let error;
      if (editingId) {
        ({ error } = await supabase
          .from("episodes")
          .update(payload)
          .eq("id", editingId));
      } else {
        ({ error } = await supabase
          .from("episodes")
          .insert([payload]));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: editingId
          ? "Episode updated successfully."
          : "Episode added successfully.",
      });
      
      setOpen(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error saving episode:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save episode",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: Episode) => {
    setEditingId(item.id);
    setFormData({
      anime_slug: item.anime_slug,
      season_number: item.season_number || 1,
      episode_number: item.episode_number || 1,
      title: item.title || "",
      description: item.description || "",
      video_url: item.video_url || "",
      server_urls: item.server_urls || {},
      thumbnail: item.thumbnail || "",
      duration: item.duration || 0,
      is_published: item.is_published ?? true,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this episode? This action cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from("episodes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({ 
        title: "Deleted", 
        description: "Episode removed successfully." 
      });
      fetchData();
    } catch (error: any) {
      console.error("Error deleting episode:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete episode",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      anime_slug: "",
      season_number: 1,
      episode_number: 1,
      title: "",
      description: "",
      video_url: "",
      server_urls: {},
      thumbnail: "",
      duration: 0,
      is_published: true,
    });
  };

  // Filtered and sorted episodes
  const filteredEpisodes = useMemo(() => {
    let filtered = episodes.filter(ep => {
      const matchesSearch = !searchTerm || 
        ep.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.anime?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.episode_number.toString().includes(searchTerm) ||
        ep.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAnime = filterAnime === "all" || ep.anime_slug === filterAnime;
      const matchesSeason = filterSeason === "all" || ep.season_number.toString() === filterSeason;
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "published" && ep.is_published) ||
        (filterStatus === "unpublished" && !ep.is_published);
      
      return matchesSearch && matchesAnime && matchesSeason && matchesStatus;
    });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'episode_asc':
          return a.episode_number - b.episode_number;
        case 'episode_desc':
          return b.episode_number - a.episode_number;
        case 'season_asc':
          return a.season_number - b.season_number || a.episode_number - b.episode_number;
        case 'season_desc':
          return b.season_number - a.season_number || b.episode_number - a.episode_number;
        case 'title_asc':
          return (a.title || "").localeCompare(b.title || "");
        case 'title_desc':
          return (b.title || "").localeCompare(a.title || "");
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [episodes, searchTerm, filterAnime, filterSeason, filterStatus, sortBy]);

  // Get unique seasons for filter
  const uniqueSeasons = useMemo(() => {
    const seasons = [...new Set(episodes.map(ep => ep.season_number))].sort();
    return seasons;
  }, [episodes]);

  // Bulk operations
  const handleBulkAction = async () => {
    if (!bulkAction || selectedEpisodes.length === 0) return;

    try {
      let updateData = {};
      
      switch (bulkAction) {
        case "publish":
          updateData = { is_published: true };
          break;
        case "unpublish":
          updateData = { is_published: false };
          break;
        case "delete":
          if (!confirm(`Permanently delete ${selectedEpisodes.length} episodes?`)) return;
          break;
        default:
          return;
      }

      if (bulkAction === "delete") {
        const { error } = await supabase
          .from("episodes")
          .delete()
          .in("id", selectedEpisodes);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("episodes")
          .update(updateData)
          .in("id", selectedEpisodes);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${selectedEpisodes.length} episodes ${bulkAction}ed successfully`,
      });
      
      setSelectedEpisodes([]);
      setBulkAction("");
      fetchData();
    } catch (error: any) {
      console.error("Bulk action error:", error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${bulkAction} episodes`,
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedEpisodes.length === filteredEpisodes.length) {
      setSelectedEpisodes([]);
    } else {
      setSelectedEpisodes(filteredEpisodes.map(ep => ep.id));
    }
  };

  const copyServerUrl = (serverId: string, slug: string) => {
    const server = servers.find(s => s.id === serverId);
    if (server && slug) {
      const fullUrl = `${server.embed_url}${slug}`;
      navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Copied!",
        description: `${server.name} URL copied to clipboard`,
      });
    }
  };

  const getFullEmbedUrl = (serverId: string, slug: string) => {
    const server = servers.find(s => s.id === serverId);
    return server && slug ? `${server.embed_url}${slug}` : '';
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
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
      {/* Header */}
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Episode Management
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage episodes across all anime series ({filteredEpisodes.length} of {episodes.length} episodes)
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedEpisodes.length > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedEpisodes.length} selected
                </span>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publish">Publish</SelectItem>
                    <SelectItem value="unpublish">Unpublish</SelectItem>
                    <SelectItem value="delete" className="text-destructive">
                      Delete
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                >
                  Apply
                </Button>
              </div>
            )}
            
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
                  Add Episode
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {editingId ? (
                      <>
                        <Pencil className="h-5 w-5" />
                        Edit Episode
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        Add New Episode
                      </>
                    )}
                  </DialogTitle>
                </DialogHeader>

                {/* Enhanced Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="anime_slug" className="flex items-center gap-2">
                          Anime <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.anime_slug}
                          onValueChange={(v) => setFormData({ ...formData, anime_slug: v })}
                        >
                          <SelectTrigger className="focus-visible:ring-primary">
                            <SelectValue placeholder="Select anime" />
                          </SelectTrigger>
                          <SelectContent>
                            {anime.map((a) => (
                              <SelectItem key={a.slug} value={a.slug}>
                                <div className="flex items-center gap-2">
                                  {a.cover_image && (
                                    <img 
                                      src={a.cover_image} 
                                      alt="" 
                                      className="w-6 h-8 object-cover rounded"
                                    />
                                  )}
                                  <span>{a.title}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Season</Label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.season_number}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                season_number: parseInt(e.target.value) || 1,
                              })
                            }
                            className="focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Episode</Label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.episode_number}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                episode_number: parseInt(e.target.value) || 1,
                              })
                            }
                            className="focus-visible:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.duration}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              duration: parseInt(e.target.value) || 0,
                            })
                          }
                          className="focus-visible:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="Episode title (optional)"
                          className="focus-visible:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          rows={4}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          placeholder="Episode description..."
                          className="resize-none focus-visible:ring-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="is_published" className="flex items-center gap-2 cursor-pointer">
                          {formData.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          Published
                        </Label>
                        <Switch
                          id="is_published"
                          checked={formData.is_published}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, is_published: checked })
                          }
                        />
                      </div>
                    </div>

                    {/* Right Column - Media & URLs */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Thumbnail URL</Label>
                        <Input
                          value={formData.thumbnail}
                          onChange={(e) =>
                            setFormData({ ...formData, thumbnail: e.target.value })
                          }
                          placeholder="https://example.com/thumbnail.jpg"
                          className="focus-visible:ring-primary"
                        />
                        {formData.thumbnail && (
                          <div className="mt-2">
                            <Label className="text-xs text-muted-foreground">Preview:</Label>
                            <div className="relative mt-1 border rounded-lg overflow-hidden">
                              <img 
                                src={formData.thumbnail} 
                                alt="Thumbnail preview" 
                                className="w-full h-24 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Primary Video URL</Label>
                        <Input
                          value={formData.video_url}
                          onChange={(e) =>
                            setFormData({ ...formData, video_url: e.target.value })
                          }
                          placeholder="Direct video URL (optional)"
                          className="focus-visible:ring-primary"
                        />
                      </div>

                      {/* Enhanced Server URLs Section */}
                      <div className="space-y-3">
                        <Label className="flex items-center justify-between">
                          <span>Embed Server Slugs</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            Enter episode slugs/IDs only
                          </span>
                        </Label>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                          {servers.map((server) => (
                            <div key={server.id} className="space-y-2 p-3 border rounded-lg bg-muted/20">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  {server.name}
                                </Label>
                                <div className="flex gap-1">
                                  {formData.server_urls[server.id] && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => copyServerUrl(server.id, formData.server_urls[server.id])}
                                      title="Copy full URL"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => window.open(server.embed_url, '_blank')}
                                    title="View embed template"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex gap-2 items-start">
                                <div className="flex-1">
                                  <Input
                                    placeholder="episode-slug"
                                    value={formData.server_urls[server.id] || ''}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        server_urls: {
                                          ...formData.server_urls,
                                          [server.id]: e.target.value,
                                        },
                                      })
                                    }
                                    className="font-mono text-sm focus-visible:ring-primary"
                                  />
                                </div>
                              </div>
                              
                              {formData.server_urls[server.id] && (
                                <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded border break-all">
                                  {getFullEmbedUrl(server.id, formData.server_urls[server.id])}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {editingId ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      editingId ? "Update Episode" : "Add Episode"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search episodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 focus-visible:ring-primary"
            />
          </div>
          
          <Select value={filterAnime} onValueChange={setFilterAnime}>
            <SelectTrigger className="focus-visible:ring-primary">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Anime" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Anime</SelectItem>
              {anime.map((a) => (
                <SelectItem key={a.slug} value={a.slug}>
                  {a.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSeason} onValueChange={setFilterSeason}>
            <SelectTrigger className="focus-visible:ring-primary">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Seasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {uniqueSeasons.map(season => (
                <SelectItem key={season} value={season.toString()}>
                  Season {season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="focus-visible:ring-primary">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="unpublished">Unpublished</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="focus-visible:ring-primary">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Newest First</SelectItem>
              <SelectItem value="created_asc">Oldest First</SelectItem>
              <SelectItem value="episode_asc">Episode ↑</SelectItem>
              <SelectItem value="episode_desc">Episode ↓</SelectItem>
              <SelectItem value="season_asc">Season ↑</SelectItem>
              <SelectItem value="season_desc">Season ↓</SelectItem>
              <SelectItem value="title_asc">Title A-Z</SelectItem>
              <SelectItem value="title_desc">Title Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Episode Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEpisodes.length === filteredEpisodes.length && filteredEpisodes.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Anime</TableHead>
              <TableHead>Episode</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Servers</TableHead>
              <TableHead>Status</TableHead>
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
            ) : filteredEpisodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {episodes.length === 0 ? 'No episodes found. Add your first episode!' : 'No episodes match your filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredEpisodes.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedEpisodes.includes(item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEpisodes([...selectedEpisodes, item.id]);
                        } else {
                          setSelectedEpisodes(selectedEpisodes.filter(id => id !== item.id));
                        }
                      }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.anime?.cover_image && (
                        <img 
                          src={item.anime.cover_image} 
                          alt={item.anime.title}
                          className="w-10 h-14 object-cover rounded border"
                        />
                      )}
                      <div>
                        <div className="font-medium line-clamp-1">{item.anime?.title}</div>
                        <Badge variant="outline" className="text-xs">
                          S{item.season_number}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-mono font-semibold text-lg">
                      EP {item.episode_number}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-[200px]">
                      <div className="font-medium line-clamp-1">
                        {item.title || "Untitled"}
                      </div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {item.duration ? (
                      <div className="text-sm text-muted-foreground">
                        {item.duration}m
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Enhanced Server URLs */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {item.video_url && (
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      )}
                      {item.server_urls && Object.entries(item.server_urls)
                        .filter(([_, slug]) => slug)
                        .map(([serverId, slug]) => {
                          const server = servers.find(s => s.id === serverId);
                          return server ? (
                            <Badge key={serverId} variant="outline" className="text-xs">
                              {server.name}
                            </Badge>
                          ) : null;
                        })
                      }
                      {!item.video_url && (!item.server_urls || Object.values(item.server_urls).every(slug => !slug)) && (
                        <span className="text-xs text-muted-foreground">No URLs</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge 
                      variant={item.is_published ? "default" : "secondary"} 
                      className={item.is_published ? "bg-green-500" : ""}
                    >
                      {item.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Preview Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Play className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {item.video_url && (
                            <DropdownMenuItem
                              onClick={() => setPreview({ 
                                url: item.video_url, 
                                server: "Primary", 
                                type: 'direct' 
                              })}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Primary Video
                            </DropdownMenuItem>
                          )}
                          {item.server_urls && Object.entries(item.server_urls)
                            .filter(([_, slug]) => slug)
                            .map(([serverId, slug]) => {
                              const server = servers.find(s => s.id === serverId);
                              if (!server) return null;
                              return (
                                <DropdownMenuItem
                                  key={serverId}
                                  onClick={() => setPreview({ 
                                    url: getFullEmbedUrl(serverId, slug), 
                                    server: server.name,
                                    type: 'embed'
                                  })}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  {server.name}
                                </DropdownMenuItem>
                              );
                            })
                          }
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const urls = Object.entries(item.server_urls)
                              .filter(([_, slug]) => slug)
                              .map(([serverId, slug]) => {
                                const server = servers.find(s => s.id === serverId);
                                return server ? `${server.name}: ${getFullEmbedUrl(serverId, slug)}` : '';
                              })
                              .filter(Boolean)
                              .join('\n');
                            navigator.clipboard.writeText(urls);
                            toast({ title: "Copied", description: "Server URLs copied to clipboard" });
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URLs
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Preview Modal */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Video Preview — {preview?.server}
              {preview?.type === 'embed' && (
                <Badge variant="outline" className="ml-2">
                  Embed
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {preview ? (
              preview.type === 'embed' ? (
                <iframe
                  src={preview.url}
                  className="w-full aspect-video rounded-md border"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <video
                  src={preview.url}
                  controls
                  className="w-full aspect-video rounded-md border"
                >
                  Your browser does not support the video tag.
                </video>
              )
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No preview available
              </div>
            )}
            {preview && (
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(preview.url)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(preview.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
