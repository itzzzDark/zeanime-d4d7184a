import { AnimeCard } from "./AnimeCard";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Anime {
  id: string;
  title: string;
  cover_image: string;
  rating: number;
  type: string;
  status: string;
  total_episodes: number;
}

interface AnimeSectionProps {
  title: string;
  animes: Anime[];
  viewAllLink?: string;
}

export const AnimeSection = ({ title, animes, viewAllLink }: AnimeSectionProps) => {
  if (!animes || animes.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
        {viewAllLink && (
          <Button variant="ghost" className="gap-1 text-primary hover:text-primary/80">
            View All
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {animes.map((anime) => (
          <AnimeCard
            key={anime.id}
            id={anime.id}
            title={anime.title}
            coverImage={anime.cover_image || "/placeholder.svg"}
            rating={anime.rating}
            type={anime.type}
            status={anime.status}
            episodes={anime.total_episodes}
          />
        ))}
      </div>
    </section>
  );
};
