"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Database } from "@/types/database.types";
import { deleteShowcase } from "@/app/showcase/showcase-actions";
import { ShowcaseCardActions } from "./showcase-card-actions";
import { withErrorBoundary } from "@/components/error/with-error-boundary";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import ProfileHoverCard from "@/components/common/profile-hover-card";

interface ShowcaseCardProps {
  showcase: Database["public"]["Tables"]["showcases"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
    showcase_likes: Array<{ user_id: string }>;
    showcase_bookmarks: Array<{ user_id: string }>;
    showcase_comments: Array<{ id: string }>;
    name?: string | null;
    short_description?: string | null;
    thumbnail_url?: string | null;
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
  isDetailPage = false,
}: ShowcaseCardProps) {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [bookmarksCount, setBookmarksCount] = useState(initialBookmarksCount);
  const [hasBookmarked, setHasBookmarked] = useState(initialHasBookmarked);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

  const { ref: cardRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
    enabled: !isDetailPage,
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
    [],
  );

  const handleBookmarkStatusChange = useCallback(
    (newBookmarksCount: number, newHasBookmarked: boolean) => {
      setBookmarksCount(newBookmarksCount);
      setHasBookmarked(newHasBookmarked);
    },
    [],
  );

  const handleCardClick = useCallback(() => {
    if (isDetailPage) return;
    router.push(`/showcase/${showcase.id}`);
  }, [isDetailPage, showcase.id, router]);

  if (!isDetailPage && !isVisible) {
    return (
      <div
        ref={cardRef}
        className="h-[180px] bg-gray-50/50 animate-pulse rounded-xl"
      />
    );
  }

  return (
    <div
      ref={cardRef}
      className="w-full max-w-[600px] bg-[#FAFAFA] rounded-[16px] border border-gray-100 hover:border-gray-200 transition-all p-6 flex flex-col gap-5 mx-auto"
    >
      <div
        className="flex gap-5 items-start cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Left: Thumbnail */}
        <div className="relative w-[80px] h-[80px] shrink-0 bg-[#f0f0f0] rounded-[12px] overflow-hidden border border-gray-50 flex items-center justify-center">
          {showcase.thumbnail_url ? (
            <Image
              src={showcase.thumbnail_url}
              alt={showcase.name || "Showcase"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="text-gray-400 text-[10px]">No Image</div>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-grow">
          <h3 className="text-[18px] font-bold text-sydenightblue line-clamp-1 leading-[24px]">
            {showcase.name || "제목 없음"}
          </h3>
          <p className="text-[14px] text-[#666666] line-clamp-2 leading-[20px] h-[40px]">
            {showcase.short_description || "설명이 없습니다."}
          </p>

          {/* Author line */}
          <ProfileHoverCard
            userId={showcase.user_id}
            profileData={showcase.profiles}
          >
            <div className="flex items-center gap-2 mt-1.5">
              <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gray-100">
                <Image
                  src={showcase.profiles?.avatar_url || "/default_avatar.png"}
                  alt="author"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-[12px] font-bold text-sydenightblue truncate">
                {showcase.profiles?.username}
              </span>
              {showcase.profiles?.tagline && (
                <span className="text-[11px] text-gray-400 truncate hidden sm:inline">
                  {showcase.profiles.tagline}
                </span>
              )}
            </div>
          </ProfileHoverCard>
        </div>
      </div>

      {/* Action Bar */}
      <div className="pt-5 border-t border-gray-100/50">
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
      </div>
    </div>
  );
}

export const ShowcaseCard = memo(ShowcaseCardBase, (prev, next) => {
  return (
    prev.showcase.id === next.showcase.id &&
    prev.currentUserId === next.currentUserId &&
    prev.initialLikesCount === next.initialLikesCount &&
    prev.initialHasLiked === next.initialHasLiked &&
    prev.initialBookmarksCount === next.initialBookmarksCount &&
    prev.initialHasBookmarked === next.initialHasBookmarked &&
    prev.initialCommentsCount === next.initialCommentsCount
  );
});
