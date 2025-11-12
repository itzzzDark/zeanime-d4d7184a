import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import clsx from "clsx";

interface AnimeCardProps {
  id: string;
  title: string;
  coverImage: string;
}

export const AnimeCard = ({ id, title, coverImage }: AnimeCardProps) => {
  return (
    <Link to={`/anime/${id}`} aria-label={`Go to ${title} details`}>
      <Card
        className={clsx(
          "group relative overflow-hidden rounded-xl border border-border/50 bg-card/80",
          "backdrop-blur-md shadow-md transition-all duration-300",
          "hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.03]"
        )}
      >
        {/* Cover Image */}
        <div className="aspect-[3/4] relative overflow-hidden rounded-xl">
          <img
            src={coverImage}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        {/* Title */}
        <div className="p-2">
          <h3
            className={clsx(
              "font-semibold text-sm text-center text-foreground",
              "truncate group-hover:text-purple-400 transition-colors"
            )}
            title={title} // Tooltip shows full title
          >
            {title}
          </h3>
        </div>
      </Card>
    </Link>
  );
};
