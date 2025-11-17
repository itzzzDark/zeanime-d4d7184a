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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto" />
            <p className="text-lg text-purple-200">Loading cinematic experiences...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      
      <div className="flex-1">
        {/* Minimal Header */}
        <div className="border-b border-purple-800/50">
          <div className="container px-4 py-8">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-slide-up">
              Anime Movies
            </h1>
          </div>
        </div>

        {/* Controls Section */}
        <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-purple-800/30 shadow-lg">
          <div className="container px-4 py-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                <Input
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-11 rounded-xl bg-slate-800/50 border-purple-800/50 text-white placeholder:text-purple-200/50 focus:border-purple-500"
                />
              </div>

              {/* Filters and View Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-9 rounded-xl bg-slate-800/50 border-purple-800/50 text-white">
                    <Filter className="h-4 w-4 mr-2 text-purple-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-purple-800/50 text-white">
                    <SelectItem value="all" className="focus:bg-purple-600">
                      All ({statusCounts.all || 0})
                    </SelectItem>
                    <SelectItem value="completed" className="focus:bg-purple-600">
                      Completed ({statusCounts.completed || 0})
                    </SelectItem>
                    <SelectItem value="ongoing" className="focus:bg-purple-600">
                      Ongoing ({statusCounts.ongoing || 0})
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 h-9 rounded-xl bg-slate-800/50 border-purple-800/50 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-purple-800/50 text-white">
                    <SelectItem value="newest" className="focus:bg-purple-600">Newest</SelectItem>
                    <SelectItem value="oldest" className="focus:bg-purple-600">Oldest</SelectItem>
                    <SelectItem value="rating" className="focus:bg-purple-600">Rating</SelectItem>
                    <SelectItem value="title" className="focus:bg-purple-600">Title</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 border border-purple-800/50 rounded-xl p-1 bg-slate-800/50">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-7 w-7 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-7 w-7 rounded-lg text-purple-300 hover:text-white hover:bg-purple-600/50"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || statusFilter !== "all") && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-sm text-purple-300">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="text-sm bg-purple-600/50 text-purple-200 border-purple-500/50">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-2 hover:text-pink-400 transition-colors"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="text-sm bg-purple-600/50 text-purple-200 border-purple-500/50">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="ml-2 hover:text-pink-400 transition-colors"
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
                  className="h-6 text-xs text-purple-300 hover:text-white hover:bg-purple-600/50"
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
            <p className="text-purple-300">
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
              <div className="w-24 h-24 mx-auto bg-purple-900/50 rounded-full flex items-center justify-center border border-purple-800/50">
                <Search className="h-12 w-12 text-purple-400/50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-purple-200">
                  No movies found
                </h3>
                <p className="text-purple-300 max-w-md mx-auto">
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
                  className="border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white"
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
