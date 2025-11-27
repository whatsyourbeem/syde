"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Database } from "@/types/database.types";
import { deleteLog } from "@/app/log/log-actions";

import { LogCardHeader } from "./log-card-header";
import { LogCardContent } from "./log-card-content";
import { LogCardActions } from "./log-card-actions";

import { withErrorBoundary } from "@/components/error/with-error-boundary";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface LogCardProps {
  log: Database["public"]["Tables"]["logs"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
    log_likes: Array<{ user_id: string }>;
    log_bookmarks: Array<{ user_id: string }>;
    log_comments: Array<{ id: string }>;
  };
  currentUserId: string | null;
  initialLikesCount: number;
  initialHasLiked: boolean;
  initialBookmarksCount: number;
  initialHasBookmarked: boolean;
  initialCommentsCount: number;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  searchQuery?: string;
  isDetailPage?: boolean;
}

function LogCardBase({
  log,
  currentUserId,
  initialLikesCount,
  initialHasLiked,
  initialBookmarksCount,
  initialHasBookmarked,
  initialCommentsCount,
  mentionedProfiles,
  searchQuery,
  isDetailPage = false,
}: LogCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [bookmarksCount, setBookmarksCount] = useState(initialBookmarksCount);
  const [hasBookmarked, setHasBookmarked] = useState(initialHasBookmarked);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [loading, setLoading] = useState(false);

  // Intersection observer for performance optimization
  const { ref: cardRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
    enabled: !isDetailPage, // Disable on detail pages
  });

  useEffect(() => {
    setLikesCount(initialLikesCount);
    setHasLiked(initialHasLiked);
    setCommentsCount(initialCommentsCount);
    setBookmarksCount(initialBookmarksCount);
    setHasBookmarked(initialHasBookmarked);
  }, [
    initialLikesCount,
    initialHasLiked,
    initialCommentsCount,
    initialBookmarksCount,
    initialHasBookmarked,
  ]);

  const handleLikeStatusChange = useCallback(
    (newLikesCount: number, newHasLiked: boolean) => {
      setLikesCount(newLikesCount);
      setHasLiked(newHasLiked);
    },
    []
  );

  const handleBookmarkStatusChange = useCallback(
    (newBookmarksCount: number, newHasBookmarked: boolean) => {
      setBookmarksCount(newBookmarksCount);
      setHasBookmarked(newHasBookmarked);
    },
    []
  );

  const handleDelete = async () => {
    if (currentUserId !== log.user_id) return;
    setLoading(true);
    try {
      const result = await deleteLog(log.id);
      if (result.success) {
        toast.success("로그가 삭제되었습니다.");
        queryClient.invalidateQueries({ queryKey: ["logs"] });

        // Hard redirect if specified (used in detail pages)
        if (result.data?.redirectTo) {
          window.location.href = result.data.redirectTo;
        }
      } else {
        toast.error(result.error?.message || "로그 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("로그 삭제 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = useCallback(() => {
    if (isDetailPage) return;
    router.push(`/log/${log.id}`);
  }, [isDetailPage, log.id, router]);

  return (
    <div ref={cardRef} className="rounded-lg bg-card flex flex-col">
      {isDetailPage || isVisible ? (
        <>
          <LogCardHeader
            log={log}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            loading={loading}
          />

          <LogCardContent
            log={log}
            mentionedProfiles={mentionedProfiles}
            searchQuery={searchQuery}
            isDetailPage={isDetailPage}
            onCardClick={handleCardClick}
          />

          <LogCardActions
            logId={log.id}
            currentUserId={currentUserId}
            likesCount={likesCount}
            hasLiked={hasLiked}
            bookmarksCount={bookmarksCount}
            hasBookmarked={hasBookmarked}
            commentsCount={commentsCount}
            onLikeStatusChange={handleLikeStatusChange}
            onBookmarkStatusChange={handleBookmarkStatusChange}
          />
        </>
      ) : (
        <div
          className="h-32 bg-card-foreground/10 animate-pulse rounded-lg"
          style={{ height: "200px" }}
        />
      )}
    </div>
  );
}

const MemoizedLogCardBase = memo(LogCardBase, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.log.id === nextProps.log.id &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.initialLikesCount === nextProps.initialLikesCount &&
    prevProps.initialHasLiked === nextProps.initialHasLiked &&
    prevProps.initialBookmarksCount === nextProps.initialBookmarksCount &&
    prevProps.initialHasBookmarked === nextProps.initialHasBookmarked &&
    prevProps.initialCommentsCount === nextProps.initialCommentsCount &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.isDetailPage === nextProps.isDetailPage &&
    prevProps.log.profiles?.id === nextProps.log.profiles?.id
  );
});

MemoizedLogCardBase.displayName = "MemoizedLogCardBase";

export const LogCard = withErrorBoundary(MemoizedLogCardBase, {
  fallback: (
    <div className="rounded-lg bg-card p-6 border border-red-200">
      <p className="text-center text-red-600">
        로그를 불러오는 중 오류가 발생했습니다.
      </p>
    </div>
  ),
});
