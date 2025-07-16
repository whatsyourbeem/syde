'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LogCard } from './log-card';

export function LogList() {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      setCurrentUserId(userId);

      const { data: logsData, error: logsError } = await supabase
        .from('logs')
        .select(
          `
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles (username, full_name, avatar_url, updated_at),
          log_likes(user_id)
        `
        )
        .order('created_at', { ascending: false });

      if (logsError) {
        console.error('Error fetching logs:', logsError);
        setError(logsError.message);
      } else {
        const logsWithLikes = logsData?.map(log => ({
          ...log,
          likesCount: log.log_likes.length,
          hasLiked: userId ? log.log_likes.some((like: any) => like.user_id === userId) : false,
        }));
        setLogs(logsWithLikes || []);
      }
    };

    setLoading(true);
    fetchLogs().finally(() => setLoading(false));

    const channel = supabase
      .channel('syde-log-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'logs' },
        () => {
          fetchLogs();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'log_likes' },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (loading) {
    return <div className="text-center">Loading logs...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {logs.length === 0 ? (
        <p className="text-center text-muted-foreground">아직 기록된 글이 없습니다. 첫 글을 작성해보세요!</p>
      ) : (
        logs.map((log) => (
          <LogCard
            key={log.id}
            log={log}
            currentUserId={currentUserId}
            initialLikesCount={log.likesCount}
            initialHasLiked={log.hasLiked}
          />
        ))
      )}
    </div>
  );
}

