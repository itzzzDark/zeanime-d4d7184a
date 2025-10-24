import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface AnimeCardProps {
  id: string;
  title: string;
  coverImage: string;
  rating?: number;
  type: string;
  status?: string;
  episodes?: number;
}

export const AnimeCard = ({ 
  id, 
  title, 
  coverImage, 
  rating, 
  type, 
  status,
  episodes 
}: AnimeCardProps) => {
  return (
    <Link to={`/anime/${id}`}>
      <Card className="group relative overflow-hidden rounded-xl border-border/50 bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-card hover:-translate-y-1">
        <div className="aspect-[2/3] relative overflow-hidden">
          <img 
            src={coverImage} 
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-center gap-2">
                <Play className="h-8 w-8 text-primary" />
                <span className="text-white font-semibold">Watch Now</span>
              </div>
            </div>
          </div>

          {/* Status badge */}
          {status && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
              {status}
            </Badge>
          )}

          {/* Type badge */}
          <Badge className="absolute top-2 right-2 bg-secondary text-secondary-foreground">
            {type}
          </Badge>
        </div>

        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
            {episodes && episodes > 0 && (
              <span>{episodes} episodes</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};
