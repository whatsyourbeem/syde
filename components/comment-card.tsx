"use client";

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Edit, HeartIcon } from "lucide-react"; // Added Edit, HeartIcon
import { useState, useEffect } from "react";
import { CommentForm } from "./comment-form";
import { useQueryClient } from "@tanstack/react-query";

import { linkifyMentions } from "@/lib/utils";

import { Database } from "@/types/database.types";

interface CommentCardProps {
  comment: Database['public']['Tables']['log_comments']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row'] | null;
  };
  currentUserId: string | null;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  initialLikesCount: number; // New prop
  initialHasLiked: boolean; // New prop
  onLikeStatusChange: (commentId: string, newLikesCount: number, newHasLiked: boolean) => void; // New prop
}

export function CommentCard({
  comment,
  currentUserId,
  mentionedProfiles,
  initialLikesCount,
  initialHasLiked,
  onLikeStatusChange,
}: CommentCardProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount); // New state
  const [hasLiked, setHasLiked] = useState(initialHasLiked); // New state

  useEffect(() => {
    setLikesCount(initialLikesCount);
    setHasLiked(initialHasLiked);
  }, [initialLikesCount, initialHasLiked]);

  const avatarUrlWithCacheBuster = comment.profiles?.avatar_url
    ? `${comment.profiles.avatar_url}?t=${comment.profiles.updated_at ? new Date(comment.profiles.updated_at).getTime() : ''}`
    : null;

  const commentDate = comment.created_at ? new Date(comment.created_at).toLocaleString() : '';

  const handleLike = async () => {
    if (!currentUserId || loading) return;

    setLoading(true);
    let newLikesCount = likesCount;
    let newHasLiked = hasLiked;

    if (hasLiked) {
      // Unlike
      const { error } = await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", comment.id)
        .eq("user_id", currentUserId);

      if (!error) {
        newLikesCount = likesCount - 1;
        newHasLiked = false;
      } else {
        console.error("Error unliking comment:", error);
      }
    } else {
      // Like
      const { error } = await supabase
        .from("comment_likes")
        .insert({ comment_id: comment.id, user_id: currentUserId });

      if (!error) {
        newLikesCount = likesCount + 1;
        newHasLiked = true;
      } else {
        console.error("Error liking comment:", error);
      }
    }
    setLoading(false);
    setLikesCount(newLikesCount);
    setHasLiked(newHasLiked);
    onLikeStatusChange(comment.id, newLikesCount, newHasLiked); // Notify parent
  };

  const handleDelete = async () => {
    if (currentUserId !== comment.user_id) return;

    const isConfirmed = window.confirm("정말로 이 댓글을 삭제하시겠습니까?");
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
      queryClient.invalidateQueries({
        queryKey: ["comments", { logId: comment.log_id }],
      });
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
            alt={`${comment.profiles?.username || "User"}'s avatar`}
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
              {comment.profiles?.full_name ||
                comment.profiles?.username ||
                "Anonymous"}
            </p>
          </Link>
          <p className="text-xs text-muted-foreground">
            @{comment.profiles?.username || comment.user_id}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{commentDate}</p>
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={loading || isEditing}
              className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-50 flex items-center gap-1"
              aria-label="Like comment"
            >
              <HeartIcon
                className={hasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}
                size={14}
              />
              <span className="text-xs">{likesCount}</span>
            </button>
            {currentUserId === comment.user_id && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                  className="p-1 text-muted-foreground hover:text-blue-500 disabled:opacity-50"
                  aria-label="Edit comment"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-50"
                  aria-label="Delete comment"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
        {isEditing ? (
          <CommentForm
            logId={comment.log_id}
            currentUserId={currentUserId}
            initialCommentData={comment}
            onCommentUpdated={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <p className="text-sm mt-1 whitespace-pre-wrap">{linkifyMentions(comment.content, mentionedProfiles)}</p>
        )}
      </div>
    </div>
  );
}