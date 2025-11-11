"use client";

import { useState, useEffect, useTransition } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  Trash2,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [animes, setAnimes] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("monday");
  const [timeSlot, setTimeSlot] = useState("19:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load schedules and anime titles
  useEffect(() => {
    const loadData = async () => {
      try {
        const [scheduleRes, animeRes] = await Promise.all([
          supabase
            .from("anime_schedule")
            .select("*, anime(title)")
            .order("day_of_week"),
          supabase.from("anime").select("id, title").order("title"),
        ]);

        if (scheduleRes.data) setSchedules(scheduleRes.data);
        if (animeRes.data) setAnimes(animeRes.data);
      } catch (err) {
        console.error(err);
        toast({ title: "Failed to load data", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAdd = async () => {
    if (!selectedAnime) {
      toast({ title: "Please select an anime", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.from("anime_schedule").insert({
        anime_id: selectedAnime,
        day_of_week: dayOfWeek,
        time_slot: timeSlot,
      });

      if (error) {
        toast({ title: "Failed to add schedule", variant: "destructive" });
      } else {
        toast({ title: "Schedule added successfully!" });
        const { data } = await supabase
          .from("anime_schedule")
          .select("*, anime(title)")
          .order("day_of_week");
        setSchedules(data || []);
        setSelectedAnime("");
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("anime_schedule")
      .delete()
      .eq("id", deleteId);
    if (error) {
      toast({ title: "Failed to delete schedule", variant: "destructive" });
    } else {
      setSchedules((prev) => prev.filter((s) => s.id !== deleteId));
      toast({ title: "Schedule deleted" });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Schedule Management
          </h2>
        </div>
      </div>

      {/* Add Schedule Form */}
      <Card className="p-6 bg-card/60 backdrop-blur-sm border-border/40 hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-accent" />
          Add New Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Anime</Label>
            <Select value={selectedAnime} onValueChange={setSelectedAnime}>
              <SelectTrigger>
                <SelectValue placeholder="Select anime" />
              </SelectTrigger>
              <SelectContent>
                {animes.map((anime) => (
                  <SelectItem key={anime.id} value={anime.id}>
                    {anime.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Day</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              type="time"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleAdd}
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Schedule
            </Button>
          </div>
        </div>
      </Card>

      {/* Schedule Table */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
        {isLoading ? (
          <div className="p-6 grid gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No schedules found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anime</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>{schedule.anime?.title}</TableCell>
                  <TableCell className="capitalize">
                    {schedule.day_of_week}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent" />
                      {schedule.time_slot}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(schedule.id)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Delete
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this schedule? This action cannot be
            undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
