import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnimeCard } from "@/components/AnimeCard";
import { Loader2 } from "lucide-react";

const Movies = () => {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <div className="container px-4 py-8">
          <h1 className="text-4xl font-bold text-gradient mb-8 animate-slide-up">Anime Movies</h1>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movies?.map((movie, index) => (
                <div key={movie.id} className="animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <AnimeCard 
                    id={movie.slug || movie.id}
                    title={movie.title}
                    coverImage={movie.cover_image || "/placeholder.svg"}
                    rating={movie.rating || undefined}
                    status={movie.status}
                    episodes={movie.total_episodes || undefined}
                  />
                </div>
              ))}
            </div>
          )}

          {movies?.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No movies available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Movies;