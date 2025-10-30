import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, MessageSquare, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function CommentsManagement() {
  const [comments, setComments] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (username),
        anime (id, title),
        comment_likes (id)
      `)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) setComments(data as any);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchComments();
      toast({ title: "Comment deleted successfully" });
    } else {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-gradient">Comments Management</h2>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50 border-border/50">
              <TableHead>User</TableHead>
              <TableHead>Anime</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment) => (
              <TableRow key={comment.id} className="hover:bg-muted/50 border-border/50">
                <TableCell className="font-medium">
                  {comment.profiles?.username || 'Anonymous'}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => navigate(`/anime/${comment.anime?.id}`)}
                    className="flex items-center gap-1 text-accent hover:underline"
                  >
                    {comment.anime?.title}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {comment.content}
                </TableCell>
                <TableCell>{comment.comment_likes?.length || 0}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
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