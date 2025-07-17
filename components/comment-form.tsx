'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useRouter } from 'next/navigation';

interface CommentFormProps {
  logId: string;
  currentUserId: string | null;
  onCommentAdded?: () => void; // Made optional for editing
  initialCommentData?: { // New prop for editing
    id: string;
    content: string;
  };
  onCommentUpdated?: () => void; // Callback for successful update
  onCancel?: () => void; // Callback for cancel button in edit mode
}

export function CommentForm({
  logId,
  currentUserId,
  onCommentAdded,
  initialCommentData,
  onCommentUpdated,
  onCancel,
}: CommentFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [content, setContent] = useState(initialCommentData?.content || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUserId) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);

    try {
      if (initialCommentData) {
        // Update existing comment
        const { error } = await supabase
          .from('log_comments')
          .update({ content: content })
          .eq('id', initialCommentData.id);

        if (error) {
          throw error;
        }
        if (onCommentUpdated) onCommentUpdated();
      } else {
        // Insert new comment
        const { error } = await supabase.from('log_comments').insert({
          log_id: logId,
          user_id: currentUserId,
          content: content,
        });

        if (error) {
          throw error;
        }
        if (onCommentAdded) onCommentAdded(); // Notify parent component that a comment was added
      }

      setContent('');
    } catch (error: any) {
      alert(`Error ${initialCommentData ? 'updating' : 'adding'} comment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [logId, currentUserId, content, router, supabase, onCommentAdded, initialCommentData, onCommentUpdated]);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <Input
        placeholder={initialCommentData ? "댓글을 수정하세요..." : "댓글을 작성하세요..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading || !currentUserId}
        className="flex-grow"
      />
      <div className="flex flex-col gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full"
          >
            취소
          </Button>
        )}
        <Button type="submit" disabled={loading || content.trim() === '' || !currentUserId}>
          {loading
            ? initialCommentData
              ? '수정 중...'
              : '작성 중...'
            : initialCommentData
            ? '수정'
            : '작성'}
        </Button>
      </div>
    </form>
  );
