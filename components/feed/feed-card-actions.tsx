"use client";

import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useLoginDialog } from '@/context/LoginDialogContext';
import { useQueryClient } from "@tanstack/react-query";
import { toggleLogBookmark } from "@/app/feed/feed-actions";
import { InteractionActions } from "@/components/common/interaction-actions";
import { deleteLogLike, insertLogLike } from "@/lib/queries/log-queries";
import { patchFeedLog, restoreSnapshot } from "@/lib/queries/cache-patches";

interface FeedCardActionsProps {
  logId: string;
  currentUserId: string | null;
  likesCount: number;
  hasLiked: boolean;
  bookmarksCount: number;
  hasBookmarked: boolean;
  commentsCount: number;
}

function FeedCardActionsBase({
  logId,
  currentUserId,
  likesCount,
  hasLiked,
  bookmarksCount,
  hasBookmarked,
  commentsCount,
}: FeedCardActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    const wasLiked = hasLiked;
    // 캐시를 먼저 고쳐 화면에 바로 반영한다. 실패하면 스냅샷으로 되돌린다.
    const snapshot = await patchFeedLog(queryClient, logId, (log) => ({
      ...log,
      hasLiked: !wasLiked,
      likesCount: log.likesCount + (wasLiked ? -1 : 1),
    }));

    const supabase = createClient();
    try {
      if (wasLiked) {
        await deleteLogLike(supabase, logId, currentUserId);
      } else {
        await insertLogLike(supabase, logId, currentUserId);
      }
    } catch {
      toast.error(wasLiked ? "좋아요 취소 실패" : "좋아요 실패");
      restoreSnapshot(queryClient, snapshot);
    }
    setLikeLoading(false);
  }, [currentUserId, logId, hasLiked, likeLoading, openLoginDialog, queryClient]);

  const handleBookmark = useCallback(async () => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }
    if (bookmarkLoading) return;

    setBookmarkLoading(true);
    const wasBookmarked = hasBookmarked;
    const snapshot = await patchFeedLog(queryClient, logId, (log) => ({
      ...log,
      hasBookmarked: !wasBookmarked,
      bookmarksCount: log.bookmarksCount + (wasBookmarked ? -1 : 1),
    }));

    const result = await toggleLogBookmark(logId, wasBookmarked);
    if (!result.success) {
      toast.error(result.error.message);
      restoreSnapshot(queryClient, snapshot);
    }
    setBookmarkLoading(false);
  }, [currentUserId, logId, hasBookmarked, bookmarkLoading, openLoginDialog, queryClient]);

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