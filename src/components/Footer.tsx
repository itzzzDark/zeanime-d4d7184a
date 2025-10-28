import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card/50 backdrop-blur-sm border-t border-border/50 mt-auto py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg text-gradient">AnimeStream</h3>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="flex gap-6 text-sm">
            <Link to="/browse" className="text-muted-foreground hover:text-primary transition-colors">
              Browse
            </Link>
            <Link to="/movies" className="text-muted-foreground hover:text-primary transition-colors">
              Movies
            </Link>
            <Link to="/schedule" className="text-muted-foreground hover:text-primary transition-colors">
              Schedule
            </Link>
            <Link to="/profile" className="text-muted-foreground hover:text-primary transition-colors">
              Profile
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; 2025 AnimeStream. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};