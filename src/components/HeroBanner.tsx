import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroBannerProps {
  title: string;
  description: string;
  bannerImage: string;
  animeId: string;
}

export const HeroBanner = ({ title, description, bannerImage, animeId }: HeroBannerProps) => {
  return (
    <div className="relative h-[70vh] w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img 
          src={bannerImage} 
          alt={title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container h-full flex items-center px-4">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-gradient animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {title}
          </h1>
          
          <p className="text-lg text-foreground/90 line-clamp-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            {description}
          </p>

          <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <Link to={`/anime/${animeId}`}>
              <Button size="lg" className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity glow-purple">
                <Play className="h-5 w-5" />
                Watch Now
              </Button>
            </Link>
            
            <Link to={`/anime/${animeId}`}>
              <Button size="lg" variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10">
                <Info className="h-5 w-5" />
                More Info
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
