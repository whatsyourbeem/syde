import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CommentCardProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
      username: string | null;
      full_name: string | null;
      avatar_url: string | null;
      updated_at: string;
    } | null;
  };
  currentUserId: string | null;
}

export function CommentCard({ comment, currentUserId }: CommentCardProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const avatarUrlWithCacheBuster = comment.profiles?.avatar_url
    ? `${comment.profiles.avatar_url}?t=${new Date(comment.profiles.updated_at).getTime()}`
    : null;

  const commentDate = new Date(comment.created_at).toLocaleString();

  const handleDelete = async () => {
    if (currentUserId !== comment.user_id) return;

    const isConfirmed = window.confirm(
      "정말로 이 댓글을 삭제하시겠습니까?"
    );
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("log_comments")
        .delete()
        .eq("id", comment.id);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      alert(`댓글 삭제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-start gap-3 p-2 border-b last:border-b-0">
      {avatarUrlWithCacheBuster && (
        <Link href={`/${comment.profiles?.username || comment.user_id}`}>
          <Image
            src={avatarUrlWithCacheBuster}
            alt={`${comment.profiles?.username || 'User'}'s avatar`}
            width={32}
            height={32}
            className="rounded-full object-cover flex-shrink-0"
          />
        </Link>
      )}
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <Link href={`/${comment.profiles?.username || comment.user_id}`}>
            <p className="font-semibold text-sm hover:underline">
              {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous'}
            </p>
          </Link>
          <p className="text-xs text-muted-foreground">@{comment.profiles?.username || comment.user_id}</p>
          <div className="ml-auto flex items-center gap-2">
             <p className="text-xs text-muted-foreground">{commentDate}</p>
            {currentUserId === comment.user_id && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-50"
                aria-label="Delete comment"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm mt-1">{comment.content}</p>
      </div>
    </div>
  );
}
