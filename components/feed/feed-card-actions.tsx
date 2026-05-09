"use client";

import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useLoginDialog } from '@/context/LoginDialogContext';
import { toggleLogBookmark } from "@/app/feed/feed-actions";
import { InteractionActions } from "@/components/common/interaction-actions";
import { deleteLogLike, insertLogLike } from "@/lib/queries/log-queries";

interface FeedCardActionsProps {
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

function FeedCardActionsBase({
  logId,
  currentUserId,
  likesCount,
  hasLiked,
  bookmarksCount,
  hasBookmarked,
  commentsCount,
  onLikeStatusChange,
  onBookmarkStatusChange,
}: FeedCardActionsProps) {
  const router = useRouter();
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const { openLoginDialog } = useLoginDialog();

  const handleCommentClick = useCallback(() => {
    router.push(`/feed/${logId}#comments`);
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
    try {
      if (hasLiked) {
        await deleteLogLike(supabase, logId, currentUserId);
      } else {
        await insertLogLike(supabase, logId, currentUserId);
      }
    } catch (error) {
      toast.error(hasLiked ? "좋아요 취소 실패" : "좋아요 실패");
      onLikeStatusChange(likesCount, hasLiked); // Revert on error
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
      shareUrl={`/feed/${logId}`}
    />
  );
}

export const FeedCardActions = memo(FeedCardActionsBase, (prevProps, nextProps) => {
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

FeedCardActions.displayName = 'FeedCardActions';