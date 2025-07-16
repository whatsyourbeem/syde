'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LogCard } from './log-card';
import { Button } from './ui/button'; // Import Button component

const LOGS_PER_PAGE = 20; // Define logs per page

export function LogList() {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [totalLogsCount, setTotalLogsCount] = useState(0); // Total logs count state

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      setCurrentUserId(userId);

      const from = (currentPage - 1) * LOGS_PER_PAGE;
      const to = from + LOGS_PER_PAGE - 1;

      const { data: logsData, error: logsError, count } = await supabase
        .from('logs')
        .select(
          `
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles (username, full_name, avatar_url, updated_at),
          log_likes(user_id),
          log_comments(id)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

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
        setTotalLogsCount(count || 0);
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'log_comments' },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentPage]); // Added currentPage to dependency array

  if (loading) {
    return <div className="text-center">Loading logs...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {logs.length === 0 && !loading ? (
        <p className="text-center text-muted-foreground">아직 기록된 글이 없습니다. 첫 글을 작성해보세요!</p>
      ) : (
        logs.map((log) => (
          <LogCard
            key={log.id}
            log={log}
            currentUserId={currentUserId}
            initialLikesCount={log.likesCount}
            initialHasLiked={log.hasLiked}
            initialCommentsCount={log.log_comments.length}
          />
        ))
      )}
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from({ length: Math.ceil(totalLogsCount / LOGS_PER_PAGE) }, (_, i) => (
          <Button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            variant={currentPage === i + 1 ? "default" : "outline"}
            disabled={loading}
          >
            {i + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}

