import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Loader2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Schedule = () => {
  const [expandedDays, setExpandedDays] = useState<string[]>([]);

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

  const groupedByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = scheduledAnime?.filter((anime) => anime.schedule_day === day) || [];
    return acc;
  }, {} as Record<string, typeof scheduledAnime>);

  const toggleDay = (day: string) => {
    setExpandedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-4xl font-bold text-gradient animate-slide-up">Release Schedule</h1>

        {isLoading ? (
          <div className="grid gap-6">
            {daysOfWeek.map((day, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-48 rounded-md" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <Skeleton key={n} className="h-40 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {daysOfWeek.map((day) => {
              const animesForDay = groupedByDay[day];
              const isExpanded = expandedDays.includes(day);

              return (
                <div
                  key={day}
                  className="border border-border/50 rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm"
                >
                  <button
                    onClick={() => toggleDay(day)}
                    className="w-full px-4 py-3 flex justify-between items-center font-semibold text-lg hover:bg-muted/20 transition-colors"
                  >
                    {day}
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {animesForDay.length > 0 ? (
                        animesForDay.map((anime) => (
                          <Link key={anime.id} to={`/anime/${anime.id}`}>
                            <Card className="flex flex-col hover:scale-105 transform transition-all cursor-pointer">
                              <img
                                src={anime.cover_image || "/placeholder.svg"}
                                alt={anime.title}
                                className="w-full h-48 object-cover rounded-t-lg"
                              />
                              <div className="p-3 flex-1 flex flex-col justify-between">
                                <h3 className="font-bold text-lg line-clamp-2">{anime.title}</h3>
                                {anime.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                                    {anime.description}
                                  </p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-2 items-center">
                                  {anime.schedule_time && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {anime.schedule_time}
                                    </Badge>
                                  )}
                                  <Badge variant="outline">{anime.type}</Badge>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        ))
                      ) : (
                        <p className="col-span-full text-center text-muted-foreground py-4">
                          No scheduled releases for this day.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Schedule;
