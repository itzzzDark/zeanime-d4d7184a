import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Pencil, Trash2, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function EpisodeManagement() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [anime, setAnime] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ url: string; server: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnime, setFilterAnime] = useState<string>("");

  const [formData, setFormData] = useState({
    anime_id: "",
    season_number: 1,
    episode_number: 1,
    title: "",
    description: "",
    video_url: "",
    filemoon_url: "",
    abyss_url: "",
    player4me_url: "",
    thumbnail: "",
    duration: 0,
  });

  useEffect(() => {
    fetchEpisodes();
    fetchAnime();
  }, []);

  const fetchEpisodes = async () => {
    const { data, error } = await supabase
      .from("episodes")
      .select("*, anime(title)")
      .order("anime_id", { ascending: true })
      .order("season_number", { ascending: true })
      .order("episode_number", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) setEpisodes(data);
  };

  const fetchAnime = async () => {
    const { data, error } = await supabase.from("anime").select("id, title").order("title");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) setAnime(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // basic validation
    if (!formData.anime_id || !formData.video_url) {
      toast({
        title: "Missing Required Fields",
        description: "Anime and video URL are required.",
        variant: "destructive",
      });
      return;
    }

    const payload = { ...formData };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("episodes").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("episodes").insert([payload]));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Success",
        description: editingId
          ? "Episode updated successfully."
          : "Episode added successfully.",
      });
      setOpen(false);
      setEditingId(null);
      resetForm();
      fetchEpisodes();
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      anime_id: item.anime_id,
      season_number: item.season_number || 1,
      episode_number: item.episode_number || 1,
      title: item.title || "",
      description: item.description || "",
      video_url: item.video_url || "",
      filemoon_url: item.filemoon_url || "",
      abyss_url: item.abyss_url || "",
      player4me_url: item.player4me_url || "",
      thumbnail: item.thumbnail || "",
      duration: item.duration || 0,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this episode?")) return;
    const { error } = await supabase.from("episodes").delete().eq("id", id);
    if (error)
      toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Deleted", description: "Episode removed successfully." });
      fetchEpisodes();
    }
  };

  const resetForm = () =>
    setFormData({
      anime_id: "",
      season_number: 1,
      episode_number: 1,
      title: "",
      description: "",
      video_url: "",
      filemoon_url: "",
      abyss_url: "",
      player4me_url: "",
      thumbnail: "",
      duration: 0,
    });

  const serverLabels: Record<string, string> = {
    filemoon_url: "FileMoon",
    abyss_url: "Abyss",
    player4me_url: "Player4Me",
  };

  // Filtered episodes
  const filteredEpisodes = useMemo(() => {
    return episodes.filter(ep => {
      const matchesSearch = !searchTerm || 
        ep.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.anime?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.episode_number.toString().includes(searchTerm);
      
      const matchesAnime = !filterAnime || ep.anime_id === filterAnime;
      
      return matchesSearch && matchesAnime;
    });
  }, [episodes, searchTerm, filterAnime]);

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedEpisodes.length} episodes?`)) return;
    
    const { error } = await supabase
      .from("episodes")
      .delete()
      .in("id", selectedEpisodes);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Episodes deleted" });
      setSelectedEpisodes([]);
      fetchEpisodes();
    }
  };

  const toggleSelectAll = () => {
    if (selectedEpisodes.length === filteredEpisodes.length) {
      setSelectedEpisodes([]);
    } else {
      setSelectedEpisodes(filteredEpisodes.map(ep => ep.id));
    }
  };

  return (
    <Card className="p-6 border-border/50">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Episode Management</h2>
          <div className="flex gap-2">
            {selectedEpisodes.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedEpisodes.length}
              </Button>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm();
                    setEditingId(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Episode
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Episode" : "Add New Episode"}</DialogTitle>
                </DialogHeader>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Anime Select */}
                  <div className="space-y-2">
                    <Label>Anime *</Label>
                    <Select
                      value={formData.anime_id}
                      onValueChange={(v) => setFormData({ ...formData, anime_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select anime" />
                      </SelectTrigger>
                      <SelectContent>
                        {anime.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Numbers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Season *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.season_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            season_number: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Episode *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.episode_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            episode_number: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  {/* URLs */}
                  {["video_url", "filemoon_url", "abyss_url", "player4me_url"].map((key) => (
                    <div key={key}>
                      <Label>
                        {key === "video_url"
                          ? "Primary Video URL *"
                          : serverLabels[key] + " URL"}
                      </Label>
                      <Input
                        value={formData[key as keyof typeof formData] as string}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [key]: e.target.value,
                          })
                        }
                        required={key === "video_url"}
                      />
                    </div>
                  ))}

                  <div>
                    <Label>Thumbnail</Label>
                    <Input
                      value={formData.thumbnail}
                      onChange={(e) =>
                        setFormData({ ...formData, thumbnail: e.target.value })
                      }
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    {editingId ? "Update Episode" : "Add Episode"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search episodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={filterAnime} onValueChange={setFilterAnime}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by anime" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Anime</SelectItem>
              {anime.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground flex items-center">
            Showing {filteredEpisodes.length} of {episodes.length} episodes
          </div>
        </div>
      </div>

      {/* Episode Table */}
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
            <TableHead>Season</TableHead>
            <TableHead>Episode</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredEpisodes.map((item) => (
            <TableRow key={item.id}>
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
              <TableCell>{item.anime?.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{item.season_number}</Badge>
              </TableCell>
              <TableCell>Ep {item.episode_number}</TableCell>
              <TableCell>{item.title || "-"}</TableCell>

              {/* Preview buttons */}
              <TableCell>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(serverLabels).map((key) => (
                    <Button
                      key={key}
                      size="sm"
                      variant="outline"
                      disabled={!item[key]}
                      onClick={() =>
                        setPreview({ url: item[key], server: serverLabels[key] })
                      }
                    >
                      <Play className="h-3 w-3 mr-1" /> {serverLabels[key]}
                    </Button>
                  ))}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Preview Modal */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview — {preview?.server}</DialogTitle>
          </DialogHeader>
          {preview ? (
            <iframe
              src={preview.url}
              className="w-full aspect-video rounded-md"
              allowFullScreen
            />
          ) : (
            <p className="text-center text-muted-foreground">No preview available</p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
