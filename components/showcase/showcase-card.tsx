"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Database } from "@/types/database.types";
import { deleteShowcase } from "@/app/showcase/showcase-actions";
import { ShowcaseCardActions } from "./showcase-card-actions";
import { ShowcaseThumbnail } from "./showcase-thumbnail";
import { withErrorBoundary } from "@/components/error/with-error-boundary";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { SydePickBadge } from "./syde-pick-badge";

interface ShowcaseCardProps {
  showcase: Database["public"]["Tables"]["showcases"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
    showcase_upvotes: Array<{ user_id: string }>;
    showcase_comments: Array<{ id: string }>;
    name?: string | null;
    short_description?: string | null;
    thumbnail_url?: string | null;
    views_count?: number;
    slug?: string | null;
    showcase_awards: Array<{ date: string; type: string }>;
  };
  currentUserId: string | null;
  initialUpvotesCount: number;
  initialHasUpvoted: boolean;
  initialCommentsCount: number;
  initialViewsCount: number;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  searchQuery?: string;
  isDetailPage?: boolean;
}

function ShowcaseCardBase({
  showcase,
  currentUserId,
  initialUpvotesCount,
  initialHasUpvoted,
  initialCommentsCount,
  initialViewsCount,
  isDetailPage = false,
}: ShowcaseCardProps) {
  const router = useRouter();
  const [upvotesCount, setUpvotesCount] = useState(initialUpvotesCount);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

  const { ref: cardRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
    enabled: !isDetailPage,
  });

  useEffect(() => {
    setUpvotesCount(initialUpvotesCount);
    setHasUpvoted(initialHasUpvoted);
    setCommentsCount(initialCommentsCount);
  }, [
    initialUpvotesCount,
    initialHasUpvoted,
    initialCommentsCount,
  ]);

  const handleUpvoteStatusChange = useCallback(
    (newUpvotesCount: number, newHasUpvoted: boolean) => {
      setUpvotesCount(newUpvotesCount);
      setHasUpvoted(newHasUpvoted);
    },
    [],
  );

  const handleCardClick = useCallback(() => {
    if (isDetailPage) return;
    router.push(`/showcase/${showcase.slug || showcase.id}`);
  }, [isDetailPage, showcase.slug, showcase.id, router]);

  if (!isDetailPage && !isVisible) {
    return (
      <div
        ref={cardRef}
        className="py-6 px-3 flex flex-col gap-2 md:gap-0"
      >
        <div className="flex gap-3 md:gap-4">
          <div className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] bg-gray-100 rounded-[10px] shrink-0" />
          <div className="flex flex-col justify-between md:h-[120px] flex-1 gap-1 md:gap-0">
            <div className="flex flex-col gap-1 md:gap-2">
              <div className="h-6 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-5 bg-gray-100 rounded w-2/5" />
            </div>
            <div className="hidden md:block h-[28px] bg-gray-100 rounded w-1/3" />
          </div>
        </div>
        <div className="md:hidden h-[28px] bg-gray-100 rounded w-1/3" />
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="w-full h-auto md:h-auto py-6 px-3 flex flex-col items-start gap-2 md:gap-0 box-border overflow-hidden"
    >
      {/* Media + Content Wrapper */}
      <div
        className="flex flex-row gap-3 md:gap-4 items-start cursor-pointer w-full"
        onClick={handleCardClick}
      >
        {/* Thumbnail (Mobile: 80x80 / Desktop: 120x120) */}
        <ShowcaseThumbnail
          src={showcase.thumbnail_url}
          alt={showcase.name || "Showcase"}
          containerClassName="w-[80px] h-[80px] md:w-[120px] md:h-[120px] shrink-0 rounded-[10px]"
        />

        {/* Content Area */}
        <div className="flex flex-col justify-between md:h-[120px] min-w-0 flex-grow gap-1 md:gap-0">
          <div className="flex flex-col gap-1 md:gap-2 w-full">
            <div className="flex flex-row items-center justify-between gap-[10px] w-full">
              {/* Title (Mobile: 16px / Desktop: 20px Bold) */}
              <h3 className="text-[16px] md:text-[20px] font-bold text-black line-clamp-1 leading-[150%] md:leading-[27px] flex-1 min-w-0">
                {showcase.name || "제목 없음"}
              </h3>
              {showcase.showcase_awards && showcase.showcase_awards.length > 0 && (
                <div onClick={(e) => e.stopPropagation()}>
                  <SydePickBadge awards={showcase.showcase_awards} />
                </div>
              )}
            </div>
            {/* Description (Mobile: 13px / Desktop: 15px) */}
            <p className="text-[13px] md:text-[15px] font-normal text-black line-clamp-1 leading-[150%] md:leading-[21px]">
              {showcase.short_description || "설명이 없습니다."}
            </p>
            {/* Profile Line (Mobile: 13px/11px / Desktop: 14px/12px) */}
            <div className="h-5 w-full relative">
              <ProfileHoverCard
                userId={showcase.user_id}
                profileData={showcase.profiles}
              >
                <div className="flex items-center gap-[5px] h-5">
                  <div className="relative w-5 h-5 overflow-hidden shrink-0 bg-[#D9D9D9] rounded-full">
                    <Image
                      src={showcase.profiles?.avatar_url || "/default_avatar.png"}
                      alt="author"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-[13px] md:text-[14px] font-semibold text-sydeblue leading-tight whitespace-nowrap">
                    {showcase.profiles?.full_name ||
                      showcase.profiles?.username}
                  </span>
                  <span className="text-[11px] md:text-[12px] font-normal text-[#777777] leading-tight truncate flex-grow">
                    {showcase.profiles?.tagline && (
                      <>&nbsp;|&nbsp;{showcase.profiles.tagline}</>
                    )}
                  </span>
                </div>
              </ProfileHoverCard>
            </div>
          </div>

          {/* Actions (Desktop: Inline) */}
          <div
            className="hidden md:block w-full h-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <ShowcaseCardActions
              showcaseId={showcase.id}
              currentUserId={currentUserId}
              upvotesCount={upvotesCount}
              hasUpvoted={hasUpvoted}
              commentsCount={commentsCount}
              viewsCount={initialViewsCount}
              onUpvoteStatusChange={handleUpvoteStatusChange}
            />
          </div>
        </div>
      </div>

      {/* Actions (Mobile: Bottom row) */}
      <div
        className="md:hidden w-full h-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <ShowcaseCardActions
          showcaseId={showcase.id}
          currentUserId={currentUserId}
          upvotesCount={upvotesCount}
          hasUpvoted={hasUpvoted}
          commentsCount={commentsCount}
          viewsCount={initialViewsCount}
          onUpvoteStatusChange={handleUpvoteStatusChange}
        />
      </div>
    </div>
  );
}

export const ShowcaseCard = memo(ShowcaseCardBase, (prev, next) => {
  return (
    prev.showcase.id === next.showcase.id &&
    prev.currentUserId === next.currentUserId &&
    prev.initialUpvotesCount === next.initialUpvotesCount &&
    prev.initialHasUpvoted === next.initialHasUpvoted &&
    prev.initialCommentsCount === next.initialCommentsCount &&
    prev.initialViewsCount === next.initialViewsCount
  );
});
