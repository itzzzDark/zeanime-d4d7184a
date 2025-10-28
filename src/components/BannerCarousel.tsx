import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  anime_id: string | null;
}

export function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: banners, isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      
      if (error) throw error;
      return data as Banner[];
    },
  });

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners]);

  const handlePrev = () => {
    if (!banners) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    if (!banners) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (isLoading || !banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-black">
      {/* Banner Image */}
      <div className="absolute inset-0">
        <img
          src={currentBanner.image_url}
          alt={currentBanner.title}
          className="w-full h-full object-cover animate-fade-in"
          key={currentBanner.id}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl space-y-4 animate-fade-in" key={currentBanner.id}>
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
            {currentBanner.title}
          </h1>
          {currentBanner.description && (
            <p className="text-lg text-white/90 line-clamp-3 drop-shadow-md">
              {currentBanner.description}
            </p>
          )}
          <div className="flex gap-4">
            {currentBanner.anime_id && (
              <>
                <Link to={`/anime/${currentBanner.anime_id}`}>
                  <Button size="lg" className="gap-2 hover-lift">
                    <Play className="h-5 w-5" />
                    Watch Now
                  </Button>
                </Link>
                <Link to={`/anime/${currentBanner.anime_id}`}>
                  <Button size="lg" variant="outline" className="gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/30 text-white hover-lift">
                    <Info className="h-5 w-5" />
                    More Info
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
