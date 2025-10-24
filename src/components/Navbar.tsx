import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export const Navbar = ({ onSearch }: NavbarProps) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <span className="text-xl font-bold text-white">A</span>
            </div>
            <span className="text-xl font-bold text-gradient">AnimeStream</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                Home
              </Button>
            </Link>
            <Link to="/anime">
              <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                Anime
              </Button>
            </Link>
            <Link to="/movies">
              <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                Movies
              </Button>
            </Link>
            <Link to="/schedule">
              <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                Schedule
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search anime..."
              className="w-64 pl-9 bg-input border-border/50 focus:border-primary"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
          
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};
