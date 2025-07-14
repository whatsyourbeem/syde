'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useRouter } from 'next/navigation';

interface CommentFormProps {
  logId: string;
  currentUserId: string | null;
  onCommentAdded: () => void;
}

export function CommentForm({ logId, currentUserId, onCommentAdded }: CommentFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUserId) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('log_comments').insert({
        log_id: logId,
        user_id: currentUserId,
        content: content,
      });

      if (error) {
        throw error;
      }

      setContent('');
      onCommentAdded(); // Notify parent component that a comment was added
    } catch (error: any) {
      alert(`Error adding comment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [logId, currentUserId, content, router, supabase, onCommentAdded]);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <Input
        type="text"
        placeholder="댓글을 작성하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading || !currentUserId}
        className="flex-grow"
      />
      <Button type="submit" disabled={loading || content.trim() === '' || !currentUserId}>
        {loading ? '작성 중...' : '작성'}
      </Button>
    </form>
  );
}
