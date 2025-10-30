import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function ScheduleManagement() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [animes, setAnimes] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('monday');
  const [timeSlot, setTimeSlot] = useState('19:00');

  useEffect(() => {
    fetchSchedules();
    fetchAnimes();
  }, []);

  const fetchSchedules = async () => {
    const { data } = await supabase
      .from('anime_schedule')
      .select('*, anime(title)')
      .order('day_of_week');
    if (data) setSchedules(data);
  };

  const fetchAnimes = async () => {
    const { data } = await supabase
      .from('anime')
      .select('id, title')
      .order('title');
    if (data) setAnimes(data);
  };

  const handleAdd = async () => {
    if (!selectedAnime) {
      toast({ title: "Please select an anime", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('anime_schedule')
      .insert({
        anime_id: selectedAnime,
        day_of_week: dayOfWeek,
        time_slot: timeSlot
      });

    if (error) {
      toast({ title: "Failed to add schedule", variant: "destructive" });
    } else {
      fetchSchedules();
      setSelectedAnime('');
      toast({ title: "Schedule added successfully!" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('anime_schedule')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchSchedules();
      toast({ title: "Schedule deleted" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-gradient">Schedule Management</h2>
      </div>

      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
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
                <SelectValue />
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
            <Button onClick={handleAdd} className="w-full hover-lift">
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50 border-border/50">
              <TableHead>Anime</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id} className="hover:bg-muted/50 border-border/50">
                <TableCell className="font-medium">{schedule.anime?.title}</TableCell>
                <TableCell>
                  <span className="capitalize">{schedule.day_of_week}</span>
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
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}