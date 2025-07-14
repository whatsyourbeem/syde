'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CommentCard } from './comment-card';

interface CommentListProps {
  logId: string;
  currentUserId: string | null;
}

export function CommentList({ logId, currentUserId }: CommentListProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('log_comments')
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          profiles (username, full_name, avatar_url, updated_at)
        `
        )
        .eq('log_id', logId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        setError(error.message);
      } else {
        setComments(data || []);
      }
      setLoading(false);
    };

    fetchComments();

    // Realtime subscription for new comments
    const channel = supabase
      .channel(`log_comments_for_${logId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'log_comments', filter: `log_id=eq.${logId}` },
        (payload) => {
          fetchComments(); // Refetch comments when a new one is added
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, logId]);

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Loading comments...</div>;
  }

  if (error) {
    return <div className="text-center text-sm text-red-500">Error: {error}</div>;
  }

  return (
    <div className="mt-4 space-y-2">
      {comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
      ) : (
        comments.map((comment) => <CommentCard key={comment.id} comment={comment} />)
      )}
    </div>
  );
}
