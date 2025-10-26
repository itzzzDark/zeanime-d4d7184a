import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Loader2, Clock } from "lucide-react";

const Schedule = () => {
  const { data: scheduledAnime, isLoading } = useQuery({
    queryKey: ["scheduled-anime"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("status", "ongoing")
        .not("schedule_day", "is", null)
        .order("schedule_day", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const groupedByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = scheduledAnime?.filter(anime => anime.schedule_day === day) || [];
    return acc;
  }, {} as Record<string, typeof scheduledAnime>);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <div className="container px-4 py-8">
          <h1 className="text-4xl font-bold text-gradient mb-8 animate-slide-up">Release Schedule</h1>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {daysOfWeek.map((day, dayIndex) => (
                <div key={day} className="animate-fade-in" style={{ animationDelay: `${dayIndex * 0.1}s` }}>
                  <h2 className="text-2xl font-bold mb-4">{day}</h2>
                  <div className="grid gap-4">
                    {groupedByDay[day]?.length > 0 ? (
                      groupedByDay[day].map((anime) => (
                        <Link key={anime.id} to={`/anime/${anime.id}`}>
                          <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm hover-lift cursor-pointer">
                            <div className="flex items-center gap-4">
                              <img
                                src={anime.cover_image || "/placeholder.svg"}
                                alt={anime.title}
                                className="w-20 h-28 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h3 className="font-bold text-lg mb-2">{anime.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {anime.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  {anime.schedule_time && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {anime.schedule_time}
                                    </Badge>
                                  )}
                                  <Badge variant="outline">{anime.type}</Badge>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))
                    ) : (
                      <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                        <p className="text-muted-foreground">No scheduled releases for this day.</p>
                      </Card>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Schedule;