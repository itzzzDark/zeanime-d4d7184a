import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Star } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";

interface AnimeCardProps {
  id: string;
  title: string;
  coverImage: string;
  rating?: number;
  status?: string;
  episodes?: number;
}

export const AnimeCard = ({
  id,
  title,
  coverImage,
  rating,
  status,
  episodes,
}: AnimeCardProps) => {
  return (
    <Link to={`/anime/${id}`} aria-label={`Go to ${title} details`}>
      <Card
        className={clsx(
          "group relative overflow-hidden rounded-xl border border-border/50 bg-card/80",
          "backdrop-blur-md shadow-md transition-all duration-300",
          "hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.03]"
        )}
      >
        {/* Image */}
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-xl">
          <img
            src={coverImage}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover rounded-t-xl transition-transform duration-700 group-hover:scale-110"
          />

          {/* Purple Watch Now (visible on hover) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-purple-600 text-white shadow-md">
              <Play className="h-3.5 w-3.5" />
              Watch Now
            </span>
          </div>

          {/* Status badge */}
          {status && (
            <Badge
              className={clsx(
                "absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full shadow-sm z-10 backdrop-blur-sm",
                status === "Ongoing"
                  ? "bg-green-500/90 text-white"
                  : "bg-gray-600/80 text-gray-200"
              )}
            >
              {status}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-purple-400 transition-colors leading-tight">
            {title}
          </h3>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            {rating !== undefined && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
            {episodes !== undefined && episodes > 0 && (
              <span className="text-gray-300">{episodes} ep</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};
