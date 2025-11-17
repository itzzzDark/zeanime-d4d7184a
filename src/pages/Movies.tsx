import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnimeCard } from "@/components/AnimeCard";
import { 
  Loader2, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SlidersHorizontal,
  X,
  Star,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type SortOption = "newest" | "oldest" | "rating" | "title";
type ViewMode = "grid" | "list";
type StatusFilter = "all" | "released" | "upcoming";

const Movies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<number>(0);

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

  const { data: genres } = useQuery({
    queryKey: ["movie-genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("genres")
        .eq("type", "movie");
      
      if (error) throw error;
      
      const allGenres = data.flatMap(anime => 
        anime.genres ? JSON.parse(anime.genres) : []
      );
      return [...new Set(allGenres)].sort();
    },
  });

  const filteredAndSortedMovies = useMemo(() => {
    if (!movies) return [];

    let filtered = movies.filter(movie => {
      // Search filter
      const matchesSearch = movie.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           movie.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "released" && movie.status === "finished") ||
                           (statusFilter === "upcoming" && movie.status === "upcoming");
      
      // Genre filter
      const matchesGenre = genreFilters.length === 0 || 
                          (movie.genres && genreFilters.some(genre => 
                            JSON.parse(movie.genres).includes(genre)
                          ));
      
      // Year filter
      const movieYear = new Date(movie.release_date || movie.created_at).getFullYear().toString();
      const matchesYear = yearFilter === "all" || movieYear === yearFilter;
      
      // Rating filter
      const matchesRating = !ratingFilter || (movie.rating && movie.rating >= ratingFilter);

      return matchesSearch && matchesStatus && matchesGenre && matchesYear && matchesRating;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [movies, searchQuery, sortBy, statusFilter, genreFilters, yearFilter, ratingFilter]);

  const availableYears = useMemo(() => {
    if (!movies) return [];
    const years = movies
      .map(movie => new Date(movie.release_date || movie.created_at).getFullYear())
      .filter(year => !isNaN(year));
    return [...new Set(years)].sort((a, b) => b - a);
  }, [movies]);

  const activeFilterCount = genreFilters.length + (yearFilter !== "all" ? 1 : 0) + (ratingFilter > 0 ? 1 : 0);

  const clearAllFilters = () => {
    setGenreFilters([]);
    setYearFilter("all");
    setRatingFilter(0);
    setStatusFilter("all");
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      
      <div className="flex-1">
        <div className="container px-4 py-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gradient bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Anime Movies
              </h1>
              <p className="text-muted-foreground">
                Discover {filteredAndSortedMovies.length} amazing anime movies
              </p>
            </div>
            
            <div className="flex items-center gap-2 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 lg:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full lg:w-80"
                />
              </div>

              {/* View Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList className="grid w-20 grid-cols-2">
                  <TabsTrigger value="grid" size="sm">
                    <Grid3X3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list" size="sm">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filter Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Filter Movies</SheetTitle>
                  </SheetHeader>
                  
                  <ScrollArea className="h-full py-6">
                    <div className="space-y-6">
                      {/* Status Filter */}
                      <div>
                        <h4 className="font-medium mb-3">Status</h4>
                        <div className="space-y-2">
                          {["all", "released", "upcoming"].map((status) => (
                            <Button
                              key={status}
                              variant={statusFilter === status ? "default" : "outline"}
                              size="sm"
                              onClick={() => setStatusFilter(status as StatusFilter)}
                              className="w-full justify-start capitalize"
                            >
                              {status}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Rating Filter */}
                      <div>
                        <h4 className="font-medium mb-3">Minimum Rating</h4>
                        <div className="space-y-2">
                          {[0, 7, 8, 9].map((rating) => (
                            <Button
                              key={rating}
                              variant={ratingFilter === rating ? "default" : "outline"}
                              size="sm"
                              onClick={() => setRatingFilter(rating)}
                              className="w-full justify-start"
                            >
                              <Star className="h-4 w-4 mr-2 fill-current" />
                              {rating === 0 ? "Any rating" : `${rating}+`}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Year Filter */}
                      <div>
                        <h4 className="font-medium mb-3">Release Year</h4>
                        <div className="max-h-40 overflow-y-auto">
                          <Button
                            variant={yearFilter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setYearFilter("all")}
                            className="w-full justify-start mb-2"
                          >
                            All years
                          </Button>
                          {availableYears.map((year) => (
                            <Button
                              key={year}
                              variant={yearFilter === year.toString() ? "default" : "outline"}
                              size="sm"
                              onClick={() => setYearFilter(year.toString())}
                              className="w-full justify-start mb-1"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              {year}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Genre Filter */}
                      {genres && genres.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Genres</h4>
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {genres.map((genre) => (
                              <div key={genre} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`genre-${genre}`}
                                  checked={genreFilters.includes(genre)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setGenreFilters([...genreFilters, genre]);
                                    } else {
                                      setGenreFilters(genreFilters.filter(g => g !== genre));
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <label htmlFor={`genre-${genre}`} className="text-sm capitalize">
                                  {genre}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="absolute bottom-6 left-6 right-6">
                    <Button onClick={clearAllFilters} variant="outline" className="w-full">
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "newest"}
                    onCheckedChange={() => setSortBy("newest")}
                  >
                    Newest First
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "oldest"}
                    onCheckedChange={() => setSortBy("oldest")}
                  >
                    Oldest First
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "rating"}
                    onCheckedChange={() => setSortBy("rating")}
                  >
                    Highest Rated
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "title"}
                    onCheckedChange={() => setSortBy("title")}
                  >
                    Title A-Z
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {genreFilters.map(genre => (
                <Badge key={genre} variant="secondary" className="flex items-center gap-1">
                  {genre}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setGenreFilters(genreFilters.filter(g => g !== genre))}
                  />
                </Badge>
              ))}
              {yearFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Year: {yearFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setYearFilter("all")}
                  />
                </Badge>
              )}
              {ratingFilter > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Rating: {ratingFilter}+
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setRatingFilter(0)}
                  />
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Movies Grid/List */}
          {filteredAndSortedMovies.length > 0 ? (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                : "space-y-4 max-w-4xl"
            }>
              {filteredAndSortedMovies.map((movie, index) => (
                <div 
                  key={movie.id} 
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <AnimeCard 
                    id={movie.slug || movie.id}
                    title={movie.title}
                    coverImage={movie.cover_image || "/placeholder.svg"}
                    rating={movie.rating || undefined}
                    status={movie.status}
                    episodes={movie.total_episodes || undefined}
                    description={viewMode === "list" ? movie.description : undefined}
                    variant={viewMode === "list" ? "list" : "default"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-4">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No movies found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button onClick={clearAllFilters} variant="outline">
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Movies;
