"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Database } from "@/types/database.types";
import { deleteShowcase } from "@/app/showcase/showcase-actions";

import { ShowcaseCardHeader } from "./showcase-card-header";
import { ShowcaseCardContent } from "./showcase-card-content";
import { ShowcaseCardActions } from "./showcase-card-actions";

import { withErrorBoundary } from "@/components/error/with-error-boundary";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface ShowcaseCardProps {
  showcase: Database["public"]["Tables"]["showcases"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
    showcase_likes: Array<{ user_id: string }>;
    showcase_bookmarks: Array<{ user_id: string }>;
    showcase_comments: Array<{ id: string }>;
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

function ShowcaseCardBase({
  showcase,
  currentUserId,
  initialLikesCount,
  initialHasLiked,
  initialBookmarksCount,
  initialHasBookmarked,
  initialCommentsCount,
  mentionedProfiles,
  searchQuery,
  isDetailPage = false,
}: ShowcaseCardProps) {
  const router = useRouter();
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
    if (currentUserId !== showcase.user_id) return;
    setLoading(true);
    try {
      const result = await deleteShowcase(showcase.id);
      if (!result.success) {
        const errorMessage =
          result.error?.message || "쇼케이스 삭제에 실패했습니다.";
        toast.error("쇼케이스 삭제 실패", { description: errorMessage });
        setLoading(false);
      } else {
        toast.success("쇼케이스가 삭제되었습니다.");
        router.refresh();
      }
    } catch {
      toast.error("쇼케이스 삭제 중 예기치 않은 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const handleCardClick = useCallback(() => {
    if (isDetailPage) return;
    router.push(`/showcase/${showcase.id}`);
  }, [isDetailPage, showcase.id, router]);

  return (
    <div ref={cardRef} className="rounded-lg bg-card flex flex-col">
      {isDetailPage || isVisible ? (
        <>
          <ShowcaseCardHeader
            showcase={showcase}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            loading={loading}
          />

          <ShowcaseCardContent
            showcase={showcase}
            mentionedProfiles={mentionedProfiles}
            searchQuery={searchQuery}
            isDetailPage={isDetailPage}
            onCardClick={handleCardClick}
          />

          <ShowcaseCardActions
            showcaseId={showcase.id}
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

const MemoizedShowcaseCardBase = memo(ShowcaseCardBase, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.showcase.id === nextProps.showcase.id &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.initialLikesCount === nextProps.initialLikesCount &&
    prevProps.initialHasLiked === nextProps.initialHasLiked &&
    prevProps.initialBookmarksCount === nextProps.initialBookmarksCount &&
    prevProps.initialHasBookmarked === nextProps.initialHasBookmarked &&
    prevProps.initialCommentsCount === nextProps.initialCommentsCount &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.isDetailPage === nextProps.isDetailPage &&
    JSON.stringify(prevProps.showcase.profiles) ===
      JSON.stringify(nextProps.showcase.profiles)
  );
});

MemoizedShowcaseCardBase.displayName = "MemoizedShowcaseCardBase";

export const ShowcaseCard = withErrorBoundary(MemoizedShowcaseCardBase, {
  fallback: (
    <div className="rounded-lg bg-card p-6 border border-red-200">
      <p className="text-center text-red-600">
        쇼케이스를 불러오는 중 오류가 발생했습니다.
      </p>
    </div>
  ),
});
