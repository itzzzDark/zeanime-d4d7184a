import { Search, Menu, User, LogOut, Shield, Home, Film, Calendar, Compass, Bell, Bookmark, TrendingUp, Grid } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                    3
                  </Badge>
                </Button>

                {/* Bookmarks */}
                <Link to="/bookmarks">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </Link>

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
                    
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg my-1">
                      <Link to="/bookmarks" className="flex items-center">
                        <Bookmark className="h-4 w-4 mr-2 text-muted-foreground" />
                        Bookmarks
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
            
            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-xl">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[320px] border-l-border/20 bg-background/95 backdrop-blur-lg"
              >
                <SheetHeader className="border-b border-border/20 pb-4">
                  <SheetTitle className="text-left text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Menu
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 flex flex-col gap-2">
                  {/* Mobile Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                      type="search"
                      placeholder="Search anime..."
                      className="pl-10 h-10 bg-background/50 border-border/40 rounded-xl"
                      onChange={(e) => onSearch?.(e.target.value)}
                    />
                  </div>
                  
                  {/* Mobile Navigation Items */}
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
                            "w-full justify-start h-12 text-base rounded-xl transition-all duration-200",
                            isActive
                              ? "text-primary bg-primary/10 border border-primary/20"
                              : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                  
                  {/* User Section in Mobile */}
                  {user && (
                    <>
                      <div className="border-t border-border/20 my-4" />
                      
                      <Link to="/profile" onClick={() => setMobileOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start h-12 text-base rounded-xl">
                          <User className="h-5 w-5 mr-3" />
                          Profile
                        </Button>
                      </Link>
                      
                      <Link to="/bookmarks" onClick={() => setMobileOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start h-12 text-base rounded-xl">
                          <Bookmark className="h-5 w-5 mr-3" />
                          Bookmarks
                        </Button>
                      </Link>

                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start h-12 text-base rounded-xl">
                            <Shield className="h-5 w-5 mr-3" />
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 text-base rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          signOut();
                          setMobileOpen(false);
                        }}
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        Sign Out
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
