"use client";

import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Database } from "@/types/database.types";
import { deleteLog } from "@/app/log/log-actions";

import { LogCardHeader } from "./log-card-header";
import { LogCardContent } from "./log-card-content";
import { LogCardActions } from "./log-card-actions";
import { LogCardComments } from "./log-card-comments";
import { withErrorBoundary } from "@/components/error/with-error-boundary";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface LogCardProps {
  log: Database['public']['Tables']['logs']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row'] | null;
    log_likes: Array<{ user_id: string }>;
    log_comments: Array<{ id: string }>;
  };
  currentUserId: string | null;
  initialLikesCount: number;
  initialHasLiked: boolean;
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
  initialCommentsCount,
  mentionedProfiles,
  searchQuery,
  isDetailPage = false,
}: LogCardProps) {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  
  // Intersection observer for performance optimization
  const { ref: cardRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (contentRef.current) {
      const maxHeight = 12 * 24;
      if (contentRef.current.scrollHeight > maxHeight) {
        setShowReadMore(true);
      } else {
        setShowReadMore(false);
      }
    }
  }, [log.content]);

  useEffect(() => {
    setLikesCount(initialLikesCount);
    setHasLiked(initialHasLiked);
    setCommentsCount(initialCommentsCount);
  }, [initialLikesCount, initialHasLiked, initialCommentsCount]);

  const handleCommentAdded = useCallback(() => {
    setCommentsCount((prev) => prev + 1);
    setShowComments(true);
  }, []);

  const handleLikeStatusChange = useCallback((newLikesCount: number, newHasLiked: boolean) => {
    setLikesCount(newLikesCount);
    setHasLiked(newHasLiked);
  }, []);

  const handleDelete = async () => {
    if (currentUserId !== log.user_id) return;
    setLoading(true);
    try {
      const result = await deleteLog(log.id);
      if (result?.error) {
        toast.error('로그 삭제 실패', { description: result.error });
      } else {
        toast.success('로그가 삭제되었습니다.');
        router.refresh();
      }
    } catch {
      toast.error('로그 삭제 중 예기치 않은 오류가 발생했습니다.');
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
      {isVisible ? (
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
            showReadMore={showReadMore}
          />

          <LogCardActions 
            logId={log.id}
            currentUserId={currentUserId}
            likesCount={likesCount}
            hasLiked={hasLiked}
            commentsCount={commentsCount}
            showComments={showComments}
            onLikeStatusChange={handleLikeStatusChange}
            onCommentsToggle={() => setShowComments(!showComments)}
          />

          <LogCardComments 
            logId={log.id}
            currentUserId={currentUserId}
            showComments={showComments}
            onCommentAdded={handleCommentAdded}
          />
        </>
      ) : (
        <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
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
    prevProps.initialCommentsCount === nextProps.initialCommentsCount &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.isDetailPage === nextProps.isDetailPage &&
    JSON.stringify(prevProps.log.profiles) === JSON.stringify(nextProps.log.profiles)
  );
});

MemoizedLogCardBase.displayName = 'MemoizedLogCardBase';

export const LogCard = withErrorBoundary(MemoizedLogCardBase, {
  fallback: (
    <div className="rounded-lg bg-card p-6 border border-red-200">
      <p className="text-center text-red-600">로그를 불러오는 중 오류가 발생했습니다.</p>
    </div>
  )
});