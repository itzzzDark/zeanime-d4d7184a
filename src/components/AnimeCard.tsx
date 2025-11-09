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
        {/* Image */}
        <div className="aspect-[3/4] relative overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-xl"
            loading="lazy"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="bg-purple-600 px-3 py-1 rounded-md text-xs text-white font-semibold">
              <Play className="inline-block h-4 w-4 mr-1" />
              Watch Now
            </span>
          </div>

          {/* Type badge */}
          <Badge className="absolute top-2 right-2 bg-purple-500 text-white text-[10px] px-2 py-1 rounded-full">
            {type}
          </Badge>

          {/* Status badge */}
          {status && (
            <Badge
              className={clsx(
                "absolute top-2 left-2 text-[9px] px-1 py-0.5 rounded-full",
                status === "Ongoing"
                  ? "bg-green-500 text-white"
                  : "bg-gray-500 text-white"
              )}
            >
              {status}
            </Badge>
          )}
        </div>

        {/* Card body */}
        <div className="p-2 space-y-1">
          <h3 className="font-semibold text-xs line-clamp-2 text-foreground group-hover:text-purple-500 transition-colors leading-tight">
            {title}
          </h3>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            {rating && (
              <div className="flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
            {episodes && episodes > 0 && <span>{episodes} ep</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
};
