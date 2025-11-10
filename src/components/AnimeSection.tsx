import { AnimeCard } from "./AnimeCard";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Anime {
  id: string;
  slug?: string;
  title: string;
  cover_image: string;
  rating: number;
  status: string;
  total_episodes: number;
}

interface AnimeSectionProps {
  title: string;
  animes: Anime[];
  viewAllLink?: string;
  layout?: 'grid' | 'scroll';
}

export const AnimeSection = ({ title, animes, viewAllLink, layout = 'grid' }: AnimeSectionProps) => {
  if (!animes || animes.length === 0) return null;

  const isScroll = layout === 'scroll';

  return (
    <section className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-0.5 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
          <h2 className="text-base md:text-lg font-bold text-foreground uppercase tracking-wide">{title}</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
        </div>
        {viewAllLink && (
          <Link to={viewAllLink}>
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary hover:text-primary/80 hover-lift h-7">
              View All
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>

      <div className={
        isScroll 
          ? "flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory" 
          : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3"
      }>
        {animes.map((anime) => (
          <div key={anime.id} className={isScroll ? "flex-shrink-0 w-32 snap-start" : ""}>
            <AnimeCard
              id={anime.slug || anime.id}
              title={anime.title}
              coverImage={anime.cover_image || "/placeholder.svg"}
              rating={anime.rating}
              status={anime.status}
              episodes={anime.total_episodes}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
