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
          "group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-900/80 backdrop-blur-md transition-all duration-300",
          "hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105"
        )}
      >
        {/* Image Section */}
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-xl">
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Hover overlay - Watch Now text only */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-xs text-white font-semibold flex items-center gap-1">
              <Play className="h-3 w-3" />
              Watch Now
            </span>
          </div>

          {/* Status badge (small) */}
          {status && (
            <Badge
              className={clsx(
                "absolute top-2 left-2 text-[8px] px-2 py-0.5 rounded-full z-10",
                status === "Ongoing"
                  ? "bg-green-500 text-white"
                  : "bg-gray-500 text-white"
              )}
            >
              {status}
            </Badge>
          )}
        </div>

        {/* Card Body */}
        <div className="p-3 space-y-1">
          <h3 className="font-semibold text-sm line-clamp-2 text-white group-hover:text-purple-500 transition-colors leading-tight">
            {title}
          </h3>

          <div className="flex items-center justify-between text-[10px] text-gray-400">
            {rating !== undefined && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
            {episodes !== undefined && episodes > 0 && (
              <span>{episodes} ep</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};
