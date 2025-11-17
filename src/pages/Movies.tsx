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
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

type SortOption = "newest" | "oldest" | "rating" | "title";
type StatusFilter = "all" | "released" | "upcoming";

const Movies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

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
      const matchesSearch = movie.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           movie.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "released" && movie.status === "finished") ||
                           (statusFilter === "upcoming" && movie.status === "upcoming");
      
      const matchesGenre = genreFilters.length === 0 || 
                          (movie.genres && genreFilters.some(genre => 
                            JSON.parse(movie.genres).includes(genre)
                          ));
      
      const movieYear = new Date(movie.release_date || movie.created_at).getFullYear().toString();
      const matchesYear = yearFilter === "all" || movieYear === yearFilter;
      
      const matchesRating = !ratingFilter || (movie.rating && movie.rating >= ratingFilter);

      return matchesSearch && matchesStatus && matchesGenre && matchesYear && matchesRating;
    });

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
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
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
              <p className="text-muted-foreground text-sm">
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
                  className="pl-10 pr-4 w-full lg:w-64 h-10 text-sm"
                />
              </div>

              {/* Filter Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="relative h-10"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("rating")}>
                    Highest Rated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("title")}>
                    Title A-Z
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Floating Filters Panel */}
          {showFilters && (
            <div className="relative mb-6">
              <div className="absolute top-0 left-0 right-0 bg-background/95 backdrop-blur-lg border rounded-lg shadow-lg z-10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Filters</h3>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearAllFilters}
                        className="h-8 text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowFilters(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <div className="space-y-1">
                      {["all", "released", "upcoming"].map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter(status as StatusFilter)}
                          className="w-full justify-start text-xs h-8 capitalize"
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Rating</label>
                    <div className="space-y-1">
                      {[0, 7, 8, 9].map((rating) => (
                        <Button
                          key={rating}
                          variant={ratingFilter === rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRatingFilter(rating)}
                          className="w-full justify-start text-xs h-8"
                        >
                          <Star className="h-3 w-3 mr-2 fill-current" />
                          {rating === 0 ? "Any" : `${rating}+`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Year Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Release Year</label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      <Button
                        variant={yearFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setYearFilter("all")}
                        className="w-full justify-start text-xs h-8 mb-1"
                      >
                        All years
                      </Button>
                      {availableYears.map((year) => (
                        <Button
                          key={year}
                          variant={yearFilter === year.toString() ? "default" : "outline"}
                          size="sm"
                          onClick={() => setYearFilter(year.toString())}
                          className="w-full justify-start text-xs h-8 mb-1"
                        >
                          <Calendar className="h-3 w-3 mr-2" />
                          {year}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Genre Filter */}
                  {genres && genres.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Genres</label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {genres.slice(0, 8).map((genre) => (
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
                              className="rounded border-gray-300 h-3 w-3"
                            />
                            <label htmlFor={`genre-${genre}`} className="text-xs capitalize">
                              {genre}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {genreFilters.map(genre => (
                <Badge key={genre} variant="secondary" className="flex items-center gap-1 text-xs py-1">
                  {genre}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setGenreFilters(genreFilters.filter(g => g !== genre))}
                  />
                </Badge>
              ))}
              {yearFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs py-1">
                  Year: {yearFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setYearFilter("all")}
                  />
                </Badge>
              )}
              {ratingFilter > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs py-1">
                  Rating: {ratingFilter}+
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setRatingFilter(0)}
                  />
                </Badge>
              )}
            </div>
          )}

          {/* Movies Grid */}
          {filteredAndSortedMovies.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                    size="small"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No movies found</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button onClick={clearAllFilters} variant="outline" size="sm">
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
