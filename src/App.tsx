import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AnimeDetail from "./pages/AnimeDetail";
import Auth from "./pages/Auth";
import ProfileAdvanced from "./pages/ProfileAdvanced";
import Browse from "./pages/Browse";
import Movies from "./pages/Movies";
import Schedule from "./pages/Schedule";
import Watch from "./pages/Watch";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/watch/:animeId/:episodeId?" element={<Watch />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<ProfileAdvanced />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
