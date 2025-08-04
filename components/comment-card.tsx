"use client";

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HeartIcon } from "lucide-react"; // Added Edit, HeartIcon
import { useState, useEffect } from "react";
import { CommentForm } from "./comment-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button"; // Import Button

import { linkifyMentions } from "@/lib/utils";

import { Database } from "@/types/database.types";

type ProcessedComment = Database['public']['Tables']['log_comments']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'] | null;
  initialLikesCount: number;
  initialHasLiked: boolean;
  replies?: ProcessedComment[]; // Add replies property
};

interface CommentCardProps {
  comment: ProcessedComment;
  currentUserId: string | null;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  initialLikesCount: number; // New prop
  initialHasLiked: boolean; // New prop
  onLikeStatusChange: (commentId: string, newLikesCount: number, newHasLiked: boolean) => void; // New prop
  logId: string; // Add logId prop
  level: number; // Add level prop
}

export function CommentCard({
  comment,
  currentUserId,
  mentionedProfiles,
  initialLikesCount,
  initialHasLiked,
  onLikeStatusChange,
  logId, // Destructure logId
  level, // Destructure level
}: CommentCardProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount); // New state
  const [hasLiked, setHasLiked] = useState(initialHasLiked); // New state
  const [showReplyForm, setShowReplyForm] = useState(false); // New state for reply form
  const [showReplies, setShowReplies] = useState(level === 0 ? false : true); // New state for showing replies

  useEffect(() => {
    setLikesCount(initialLikesCount);
    setHasLiked(initialHasLiked);
  }, [initialLikesCount, initialHasLiked]);

  const avatarUrlWithCacheBuster = comment.profiles?.avatar_url
    ? `${comment.profiles.avatar_url}?t=${comment.profiles.updated_at ? new Date(comment.profiles.updated_at).getTime() : ''}`
    : null;

  

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
    } catch (error: unknown) {
      console.error("Error deleting comment:", error);
      alert(`댓글 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 p-2">
      <div className="flex items-start gap-3">
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
            <>
              <p className="text-sm mt-1 whitespace-pre-wrap">{linkifyMentions(comment.content, mentionedProfiles)}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleLike}
                  disabled={loading || isEditing}
                  className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-50 flex items-center gap-1 group"
                  aria-label="Like comment"
                >
                  <HeartIcon
                    className={hasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-red-500 group-hover:fill-red-500"}
                    size={14}
                  />
                  <span className="text-xs">{likesCount}</span>
                </button>
                {level < 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="text-xs text-muted-foreground hover:text-blue-500"
                  >
                    답글 달기
                  </Button>
                )}
                {currentUserId === comment.user_id && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      disabled={loading}
                      className="text-xs text-muted-foreground hover:text-blue-500"
                    >
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={loading}
                      className="text-xs text-muted-foreground hover:text-red-500"
                    >
                      삭제
                    </Button>
                  </>
                )}
              </div>
              {showReplyForm && (
                <div className="mt-2 ml-4">
                  <CommentForm
                    logId={logId}
                    currentUserId={currentUserId}
                    parentCommentId={comment.id}
                    onCommentAdded={() => setShowReplyForm(false)}
                    onCancel={() => setShowReplyForm(false)}
                  />
                </div>
              )}
              {comment.replies && comment.replies.length > 0 && level === 0 && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplies(!showReplies)}
                    className="text-xs text-muted-foreground"
                  >
                    {showReplies ? "답글 숨기기" : `답글 ${comment.replies.length}개 보기`}
                  </Button>
                </div>
              )}
              {showReplies && comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 space-y-2 border-l pl-4">
                  {comment.replies.map((reply) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      mentionedProfiles={mentionedProfiles}
                      initialLikesCount={reply.initialLikesCount}
                      initialHasLiked={reply.initialHasLiked}
                      onLikeStatusChange={onLikeStatusChange}
                      logId={logId}
                      level={level + 1}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}