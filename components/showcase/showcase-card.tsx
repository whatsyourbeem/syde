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
    showcase_upvotes: Array<{ user_id: string }>;
    showcase_comments: Array<{ id: string }>;
    name?: string | null;
    short_description?: string | null;
    thumbnail_url?: string | null;
  };
  currentUserId: string | null;
  initialUpvotesCount: number;
  initialHasUpvoted: boolean;
  initialCommentsCount: number;
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
      className="w-full h-auto md:h-auto border-b-[0.5px] border-[#B7B7B7] py-6 px-4 flex flex-col items-start gap-2 md:gap-0 box-border overflow-hidden"
    >
      {/* Media + Content Wrapper */}
      <div
        className="flex flex-row gap-3 md:gap-4 items-start cursor-pointer w-full"
        onClick={handleCardClick}
      >
        {/* Thumbnail (Mobile: 100x100 / Desktop: 120x120) */}
        <div className="relative w-[100px] h-[100px] md:w-[120px] md:h-[120px] shrink-0 bg-[#f0f0f0] rounded-[10px] overflow-hidden flex items-center justify-center">
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

        {/* Content Area */}
        <div className="flex flex-col justify-between md:h-[120px] min-w-0 flex-grow gap-1 md:gap-0">
          <div className="flex flex-col gap-2 w-full">
            {/* Title (Mobile: 18px Bold / Desktop: 20px Bold) */}
            <h3 className="text-[18px] font-bold text-black line-clamp-2 md:line-clamp-1 leading-[150%] md:leading-[27px]">
              {showcase.name || "제목 없음"}
            </h3>
            {/* Description (Mobile: 14px / Desktop: 15px) */}
            <p className="text-[14px] font-normal text-black line-clamp-1 leading-[150%] md:leading-[21px]">
              {showcase.short_description || "설명이 없습니다."}
            </p>
            {/* Profile Line (Mobile: 14px/12px / Desktop: 14px/12px) */}
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
                  <span className="text-[14px] font-semibold text-sydeblue leading-tight whitespace-nowrap">
                    {showcase.profiles?.full_name ||
                      showcase.profiles?.username}
                  </span>
                  <span className="text-[12px] font-normal text-[#777777] leading-tight truncate flex-grow">
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
              onUpvoteStatusChange={handleUpvoteStatusChange}
            />
          </div>
        </div>
      </div>

      {/* Actions (Mobile: Bottom row) */}
      <div
        className="md:hidden w-full h-[28px] mt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <ShowcaseCardActions
          showcaseId={showcase.id}
          currentUserId={currentUserId}
          upvotesCount={upvotesCount}
          hasUpvoted={hasUpvoted}
          commentsCount={commentsCount}
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
    prev.initialCommentsCount === next.initialCommentsCount
  );
});
