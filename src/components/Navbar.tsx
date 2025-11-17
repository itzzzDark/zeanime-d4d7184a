import { Search, Menu, User, LogOut, Shield, Home, Film, Calendar, Compass, TrendingUp, Grid, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export const Navbar = ({ onSearch }: NavbarProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/trending", label: "Trending", icon: TrendingUp },
    { path: "/browse", label: "Browse", icon: Compass },
    { path: "/movies", label: "Movies", icon: Film },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/genre", label: "Genre", icon: Grid },
    { path: "/community", label: "Community", icon: Users },
  ];

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out",
      scrolled 
        ? "border-b border-border/60 bg-background/90 backdrop-blur-xl shadow-sm" 
        : "border-b border-border/20 bg-background/70 backdrop-blur-lg"
    )}>
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-8">
          <Link 
            to="/" 
            className="flex items-center gap-3 group transition-all duration-300"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <span className="text-lg font-bold text-white tracking-tight">R</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Reenime
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-primary bg-primary/5 rounded-lg"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-primary rounded-full -translate-x-1/2" />
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search and User Actions */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="search"
              placeholder="Search anime..."
              className="w-72 pl-10 pr-4 h-9 bg-background/50 border-border/40 rounded-xl focus:border-primary/50 transition-colors"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
          
          {/* User Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-xl p-0">
                      <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56 rounded-xl shadow-lg border-border/50 bg-background/95 backdrop-blur-lg animate-in zoom-in-95"
                  >
                    <div className="flex items-center gap-3 p-2 border-b border-border/20">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg my-1">
                      <Link to="/profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator className="bg-border/20" />
                        <DropdownMenuItem asChild className="cursor-pointer rounded-lg my-1">
                          <Link to="/admin" className="flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator className="bg-border/20" />
                    <DropdownMenuItem 
                      onClick={signOut}
                      className="cursor-pointer rounded-lg my-1 text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button className="rounded-xl px-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all duration-200 shadow-sm hover:shadow-md">
                  Sign In
                </Button>
              </Link>
            )}
            
            {/* Floating Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-xl">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[85vw] max-w-md sm:w-[320px] border-0 bg-transparent shadow-none"
              >
                <div className="ml-auto mt-4 mr-4 w-full max-w-xs">
                  {/* Floating Menu Container */}
                  <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-b border-border/20 p-4">
                      <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                          Menu
                        </SheetTitle>
                        {user && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border-2 border-background/80">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xs">
                                {user.name?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                      </div>
                      
                      {/* Mobile Search */}
                      <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                        <Input
                          type="search"
                          placeholder="Search anime..."
                          className="pl-10 h-9 bg-background/80 border-border/40 rounded-xl text-sm"
                          onChange={(e) => {
                            onSearch?.(e.target.value);
                            setMobileOpen(false);
                          }}
                        />
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="p-2 max-h-[60vh] overflow-y-auto">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActivePath(item.path);
                        
                        return (
                          <Link 
                            key={item.path} 
                            to={item.path} 
                            onClick={() => setMobileOpen(false)}
                          >
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start h-11 text-sm rounded-xl transition-all duration-200 mb-1",
                                isActive
                                  ? "text-primary bg-primary/10 border border-primary/20 shadow-sm"
                                  : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
                              )}
                            >
                              <Icon className={cn(
                                "h-4 w-4 mr-3 transition-transform duration-200",
                                isActive && "scale-110"
                              )} />
                              {item.label}
                              {isActive && (
                                <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
                              )}
                            </Button>
                          </Link>
                        );
                      })}
                      
                      {/* User Section */}
                      {user && (
                        <>
                          <div className="border-t border-border/20 my-2" />
                          
                          <Link to="/profile" onClick={() => setMobileOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start h-11 text-sm rounded-xl mb-1">
                              <User className="h-4 w-4 mr-3" />
                              Profile
                            </Button>
                          </Link>

                          {isAdmin && (
                            <Link to="/admin" onClick={() => setMobileOpen(false)}>
                              <Button variant="ghost" className="w-full justify-start h-11 text-sm rounded-xl mb-1">
                                <Shield className="h-4 w-4 mr-3" />
                                Admin Panel
                              </Button>
                            </Link>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start h-11 text-sm rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 mb-1"
                            onClick={() => {
                              signOut();
                              setMobileOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign Out
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    {!user && (
                      <div className="border-t border-border/20 p-3 bg-gradient-to-r from-background to-background/80">
                        <Link to="/auth" onClick={() => setMobileOpen(false)}>
                          <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all duration-200 shadow-sm">
                            Sign In
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
