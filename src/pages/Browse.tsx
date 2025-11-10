import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnimeCard } from "@/components/AnimeCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const { data: anime, isLoading } = useQuery({
    queryKey: ["browse-anime", genreFilter, typeFilter, sortBy],
    queryFn: async () => {
      let query = supabase.from("anime").select("*");

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter as "series" | "movie" | "ova" | "special");
      }

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
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredAnime = anime?.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = genreFilter === "all" || item.genres?.includes(genreFilter);
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSearch={setSearchQuery} />
      
      <div className="flex-1">
        <div className="container px-4 py-8">
          <h1 className="text-4xl font-bold text-gradient mb-8 animate-slide-up">Browse Anime</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mb-8 animate-fade-in">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="Action">Action</SelectItem>
                <SelectItem value="Adventure">Adventure</SelectItem>
                <SelectItem value="Comedy">Comedy</SelectItem>
                <SelectItem value="Drama">Drama</SelectItem>
                <SelectItem value="Fantasy">Fantasy</SelectItem>
                <SelectItem value="Romance">Romance</SelectItem>
                <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAnime?.map((item, index) => (
                <div key={item.id} className="animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <AnimeCard 
                    id={item.slug || item.id}
                    title={item.title}
                    coverImage={item.cover_image || "/placeholder.svg"}
                    rating={item.rating || undefined}
                    status={item.status}
                    episodes={item.total_episodes || undefined}
                  />
                </div>
              ))}
            </div>
          )}

          {filteredAnime?.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No anime found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Browse;