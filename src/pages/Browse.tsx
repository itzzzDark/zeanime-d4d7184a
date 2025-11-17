import { useState, useMemo, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnimeCard } from "@/components/AnimeCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Loader2, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SlidersHorizontal,
  X,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type SortOption = "latest" | "rating" | "popular" | "title";

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [genreFilter, setGenreFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Fetch genres for dynamic filter options
  const { data: genres } = useQuery({
    queryKey: ["anime-genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("genres");
      
      if (error) throw error;
      
      const allGenres = data.flatMap(anime => anime.genres || []);
      const uniqueGenres = [...new Set(allGenres)].filter(Boolean).sort();
      return uniqueGenres;
    },
  });

  // Enhanced anime query with better filtering
  const { data: anime, isLoading, isError, error } = useQuery({
    queryKey: ["browse-anime", genreFilter, typeFilter, sortBy, selectedGenres],
    queryFn: async () => {
      let query = supabase.from("anime").select(`
        *,
        anime_episodes(count),
        anime_ratings(avg_rating)
      `);

      // Type filter
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      // Genre filter - support multiple selected genres
      if (selectedGenres.length > 0) {
        query = query.contains("genres", selectedGenres);
      } else if (genreFilter !== "all") {
        query = query.contains("genres", [genreFilter]);
      }

      // Enhanced sorting
      switch (sortBy) {
        case "latest":
          query = query.order("created_at", { ascending: false });
          break;
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        case "popular":
          query = query.order("view_count", { ascending: false });
          break;
        case "title":
          query = query.order("title", { ascending: true });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Enhance data with computed values
      return data.map(item => ({
        ...item,
        computedRating: item.anime_ratings?.[0]?.avg_rating || item.rating,
        episodeCount: item.anime_episodes?.[0]?.count || item.total_episodes,
      }));
    },
  });

  // Advanced search and filtering with useMemo for performance
  const filteredAnime = useMemo(() => {
    if (!anime) return [];

    return anime.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                           item.description?.toLowerCase().includes(deferredSearch.toLowerCase());
      
      return matchesSearch;
    });
  }, [anime, deferredSearch]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setGenreFilter("all");
    setTypeFilter("all");
    setSelectedGenres([]);
    setSearchQuery("");
  };

  const hasActiveFilters = genreFilter !== "all" || typeFilter !== "all" || selectedGenres.length > 0 || searchQuery;

  // Skeleton loader components
  const AnimeCardSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="aspect-[3/4] rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onSearch={setSearchQuery} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-destructive text-lg">
              Failed to load anime
            </div>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navbar onSearch={setSearchQuery} />
      
      <div className="flex-1">
        <div className="container px-4 py-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent animate-slide-up">
                Discover Anime
              </h1>
              <p className="text-muted-foreground animate-fade-in">
                Explore our curated collection of amazing anime
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                    !
                  </Badge>
                )}
              </Button>
              
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="px-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Filter Section */}
          <div className={cn(
            "space-y-4 mb-8 transition-all duration-300",
            showFilters ? "block animate-slide-down" : "hidden"
          )}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-card/50 backdrop-blur-sm">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search titles, descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
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

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest Added</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="title">A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>

            {/* Genre Tags */}
            {genres && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4" />
                  Genres
                </div>
                <div className="flex flex-wrap gap-2">
                  {genres.slice(0, 15).map((genre) => (
                    <Badge
                      key={genre}
                      variant={selectedGenres.includes(genre) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all hover:scale-105",
                        selectedGenres.includes(genre) && "bg-primary"
                      )}
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>
                {isLoading ? "Loading..." : `Found ${filteredAnime.length} anime`}
              </span>
            </div>
            
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {selectedGenres.map(genre => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
                {typeFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    {typeFilter}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Anime Grid/List */}
          {isLoading ? (
            <div className={cn(
              "gap-6",
              viewMode === "grid" 
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
                : "space-y-4"
            )}>
              {Array.from({ length: 10 }).map((_, index) => (
                <AnimeCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <>
              <div className={cn(
                "gap-6",
                viewMode === "grid" 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
                  : "space-y-4"
              )}>
                {filteredAnime.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <AnimeCard 
                      id={item.slug || item.id}
                      title={item.title}
                      coverImage={item.cover_image || "/placeholder.svg"}
                      rating={item.computedRating || undefined}
                      status={item.status}
                      episodes={item.episodeCount || undefined}
                      description={viewMode === "list" ? item.description : undefined}
                      variant={viewMode}
                    />
                  </div>
                ))}
              </div>

              {filteredAnime.length === 0 && (
                <div className="text-center py-20 space-y-4 animate-fade-in">
                  <div className="text-6xl">🎌</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No anime found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                  </div>
                  <Button onClick={clearFilters} variant="outline">
                    Clear all filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Browse;
