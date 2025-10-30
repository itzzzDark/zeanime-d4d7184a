import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Trash2, Send, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  comment_likes: { id: string }[];
}

export function Comments({ animeId }: { animeId: string }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [animeId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (username, avatar_url),
        comment_likes (id)
      `)
      .eq('anime_id', animeId)
      .order('created_at', { ascending: false });
    
    if (data) setComments(data as any);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in to comment", variant: "destructive" });
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('comments')
      .insert({ anime_id: animeId, user_id: user.id, content: newComment });

    if (error) {
      toast({ title: "Failed to post comment", variant: "destructive" });
    } else {
      setNewComment('');
      fetchComments();
      toast({ title: "Comment posted!" });
    }
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      fetchComments();
      toast({ title: "Comment deleted" });
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast({ title: "Please sign in to like", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('comment_likes')
      .insert({ comment_id: commentId, user_id: user.id });

    if (!error) fetchComments();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gradient">Comments ({comments.length})</h2>

      {user && (
        <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-4 min-h-[100px] resize-none"
          />
          <Button onClick={handleSubmit} disabled={loading} className="hover-lift">
            <Send className="mr-2 h-4 w-4" />
            Post Comment
          </Button>
        </Card>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id} className="p-4 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all">
            <div className="flex gap-4">
              <Avatar>
                <AvatarFallback className="bg-gradient-primary">
                  <User className="h-5 w-5 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{comment.profiles?.username || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(comment.id)}
                      className="hover:text-destructive"
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      {comment.comment_likes?.length || 0}
                    </Button>
                    {(user?.id === comment.user_id || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comment.id)}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}