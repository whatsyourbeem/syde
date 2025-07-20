"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HeartIcon, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Database } from "@/types/database.types";

interface LogActionsProps {
  log: Database['public']['Tables']['logs']['Row'];
  currentUserId: string | null;
  likesCount: number; // Changed from initialLikesCount
  hasLiked: boolean;   // Changed from initialHasLiked
  initialCommentsCount: number;
  isEditing: boolean;
  onEditClick: () => void;
  onLikeStatusChange: (newLikesCount: number, newHasLiked: boolean) => void; // New prop
}

export function LogActions({
  log,
  currentUserId,
  likesCount, // Use directly from props
  hasLiked,   // Use directly from props
  isEditing,
  onEditClick,
  onLikeStatusChange, // New prop
}: LogActionsProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!currentUserId || loading) return;

    setLoading(true);
    let newLikesCount = likesCount;
    let newHasLiked = hasLiked;

    if (hasLiked) {
      // Unlike
      const { error } = await supabase
        .from('log_likes')
        .delete()
        .eq('log_id', log.id)
        .eq('user_id', currentUserId);

      if (!error) {
        newLikesCount = likesCount - 1;
        newHasLiked = false;
      } else {
        console.error('Error unliking log:', error);
      }
    } else {
      // Like
      const { error } = await supabase
        .from('log_likes')
        .insert({ log_id: log.id, user_id: currentUserId });

      if (!error) {
        newLikesCount = likesCount + 1;
        newHasLiked = true;
      } else {
        console.error('Error liking log:', error);
      }
    }
    setLoading(false);
    onLikeStatusChange(newLikesCount, newHasLiked); // Notify parent of change
  };

  const handleDelete = async () => {
    if (currentUserId !== log.user_id) return;

    const isConfirmed = window.confirm('정말로 이 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (!isConfirmed) return;

    setLoading(true);
    try {
      if (log.image_url) {
        const url = new URL(log.image_url);
        const path = url.pathname.split('/logimages/')[1];
        if (path) {
          const { error: storageError } = await supabase.storage
            .from('logimages')
            .remove([path]);
          if (storageError) {
            console.error('Error deleting image from storage:', storageError);
          }
        }
      }

      const { error: dbError } = await supabase.from('logs').delete().eq('id', log.id);

      if (dbError) {
        throw dbError;
      }
      router.push('/'); // Redirect to home after deletion
    } catch (error: any) {
      console.error('Error deleting log:', error);
      alert(`로그 삭제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
      <button
        onClick={handleLike}
        disabled={loading || isEditing}
        className="flex items-center gap-1 rounded-md p-2 -m-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        <HeartIcon
          className={hasLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}
          size={18}
        />
        <span>{likesCount} Likes</span>
      </button>
      {currentUserId === log.user_id && (
        <div className="flex items-center gap-2">
          <button
            onClick={onEditClick}
            disabled={loading || isEditing}
            className="p-1 text-muted-foreground hover:text-blue-500 disabled:opacity-50"
            aria-label="Edit log"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || isEditing}
            className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-50"
            aria-label="Delete log"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}