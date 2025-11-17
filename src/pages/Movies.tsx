import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnimeCard } from "@/components/AnimeCard";
import { Loader2, Search, Filter, Grid3X3, List } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const Movies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: movies, isLoading } = useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("type", "movie")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredAndSortedMovies = useMemo(() => {
    if (!movies) return [];

    let filtered = movies.filter(movie => 
      movie.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (statusFilter === "all" || movie.status === statusFilter)
    );

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "title":
        filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
    }

    return filtered;
  }, [movies, searchQuery, statusFilter, sortBy]);

  const statusCounts = useMemo(() => {
    if (!movies) return {};
    return movies.reduce((acc: any, movie) => {
      acc[movie.status] = (acc[movie.status] || 0) + 1;
      return acc;
    }, { all: movies.length });
  }, [movies]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-lg text-muted-foreground">Loading amazing movies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-blue-50/30">
      <Navbar />
      
      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b">
          <div className="container px-4 py-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-slide-up">
                Anime Movies
              </h1>
              <p className="text-xl text-muted-foreground animate-slide-up delay-100">
                Discover breathtaking anime feature films and cinematic experiences
              </p>
              <div className="flex items-center justify-center gap-2 pt-4 animate-slide-up delay-200">
                <Badge variant="secondary" className="text-sm">
                  {movies?.length || 0} Movies
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  HD Quality
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  Multiple Genres
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b shadow-sm">
          <div className="container px-4 py-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-11 rounded-2xl bg-white/50 border-slate-200"
                />
              </div>

              {/* Filters and View Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-9 rounded-2xl">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All ({statusCounts.all || 0})
                    </SelectItem>
                    <SelectItem value="completed">
                      Completed ({statusCounts.completed || 0})
                    </SelectItem>
                    <SelectItem value="ongoing">
                      Ongoing ({statusCounts.ongoing || 0})
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 h-9 rounded-2xl">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 border rounded-2xl p-1 bg-white/50">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-7 w-7 rounded-xl"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-7 w-7 rounded-xl"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || statusFilter !== "all") && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="text-sm">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-2 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="text-sm">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="ml-2 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="h-6 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="container px-4 py-8">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Showing {filteredAndSortedMovies.length} of {movies?.length} movies
            </p>
          </div>

          {/* Movies Grid/List */}
          {filteredAndSortedMovies.length > 0 ? (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            }>
              {filteredAndSortedMovies.map((movie, index) => (
                <div 
                  key={movie.id} 
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <AnimeCard 
                    id={movie.slug || movie.id}
                    title={movie.title}
                    coverImage={movie.cover_image || "/placeholder.svg"}
                    rating={movie.rating || undefined}
                    status={movie.status}
                    episodes={movie.total_episodes || undefined}
                    variant={viewMode === "list" ? "horizontal" : "vertical"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-6">
              <div className="w-24 h-24 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  No movies found
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "No movies are currently available. Check back later for new additions!"
                  }
                </p>
              </div>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  variant="outline"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Movies;
