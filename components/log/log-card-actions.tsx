"use client";

import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useLoginDialog } from '@/context/LoginDialogContext';
import { toggleLogBookmark } from "@/app/log/log-actions";
import { InteractionActions } from "@/components/common/interaction-actions";

interface LogCardActionsProps {
  logId: string;
  currentUserId: string | null;
  likesCount: number;
  hasLiked: boolean;
  bookmarksCount: number;
  hasBookmarked: boolean;
  commentsCount: number;
  onLikeStatusChange: (newLikesCount: number, newHasLiked: boolean) => void;
  onBookmarkStatusChange: (newBookmarksCount: number, newHasBookmarked: boolean) => void;
}

function LogCardActionsBase({
  logId,
  currentUserId,
  likesCount,
  hasLiked,
  bookmarksCount,
  hasBookmarked,
  commentsCount,
  onLikeStatusChange,
  onBookmarkStatusChange,
}: LogCardActionsProps) {
  const router = useRouter();
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const { openLoginDialog } = useLoginDialog();

  const handleCommentClick = useCallback(() => {
    router.push(`/log/${logId}#comments`);
  }, [router, logId]);

  const handleLike = useCallback(async () => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }
    if (likeLoading) return;

    setLikeLoading(true);
    const newLikesCount = hasLiked ? likesCount - 1 : likesCount + 1;
    const newHasLiked = !hasLiked;
    onLikeStatusChange(newLikesCount, newHasLiked);

    const supabase = createClient();
    if (hasLiked) {
      const { error } = await supabase.from("log_likes").delete().eq("log_id", logId).eq("user_id", currentUserId);
      if (error) {
        toast.error("좋아요 취소 실패");
        onLikeStatusChange(likesCount, hasLiked); // Revert on error
      }
    } else {
      const { error } = await supabase.from("log_likes").insert({ log_id: logId, user_id: currentUserId });
      if (error) {
        toast.error("좋아요 실패");
        onLikeStatusChange(likesCount, hasLiked); // Revert on error
      }
    }
    setLikeLoading(false);
  }, [currentUserId, logId, hasLiked, likesCount, likeLoading, openLoginDialog, onLikeStatusChange]);

  const handleBookmark = useCallback(async () => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }
    if (bookmarkLoading) return;

    setBookmarkLoading(true);
    const newBookmarksCount = hasBookmarked ? bookmarksCount - 1 : bookmarksCount + 1;
    const newHasBookmarked = !hasBookmarked;
    onBookmarkStatusChange(newBookmarksCount, newHasBookmarked);

    const result = await toggleLogBookmark(logId, hasBookmarked);
    if ("error" in result && result.error) {
      toast.error(result.error.message);
      onBookmarkStatusChange(bookmarksCount, hasBookmarked); // Revert on error
    }
    setBookmarkLoading(false);
  }, [currentUserId, logId, hasBookmarked, bookmarksCount, bookmarkLoading, openLoginDialog, onBookmarkStatusChange]);

  return (
    <InteractionActions
      id={logId}
      type="log"
      stats={{
        likes: likesCount,
        comments: commentsCount,
        bookmarks: bookmarksCount
      }}
      status={{
        hasLiked,
        hasBookmarked
      }}
      loading={{
        like: likeLoading,
        bookmark: bookmarkLoading
      }}
      onLikeToggle={handleLike}
      onBookmarkToggle={handleBookmark}
      onCommentClick={handleCommentClick}
      shareUrl={`/log/${logId}`}
    />
  );
}

export const LogCardActions = memo(LogCardActionsBase, (prevProps, nextProps) => {
  return (
    prevProps.logId === nextProps.logId &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.likesCount === nextProps.likesCount &&
    prevProps.hasLiked === nextProps.hasLiked &&
    prevProps.bookmarksCount === nextProps.bookmarksCount &&
    prevProps.hasBookmarked === nextProps.hasBookmarked &&
    prevProps.commentsCount === nextProps.commentsCount
  );
});

LogCardActions.displayName = 'LogCardActions';