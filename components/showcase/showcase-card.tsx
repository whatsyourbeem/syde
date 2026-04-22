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
import { SydePickInfoDialog } from "./syde-pick-info-dialog";
import { cn } from "@/lib/utils";

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
  variant?: "default" | "featured";
  awardDateLabel?: string;
  priority?: boolean;
}

function ShowcaseCardBase({
  showcase,
  currentUserId,
  initialUpvotesCount,
  initialHasUpvoted,
  initialCommentsCount,
  initialViewsCount,
  isDetailPage = false,
  variant = "default",
  awardDateLabel,
  priority = false,
}: ShowcaseCardProps) {
  const isFeatured = variant === "featured";
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

  if (!isDetailPage && !isVisible && !priority) {
    return (
      <div
        ref={cardRef}
        className="w-full h-auto py-6 px-4 flex flex-col gap-2 md:gap-0 box-border"
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
      className={cn(
        "w-full h-auto py-6 px-4 flex flex-col items-start gap-2 md:gap-0 box-border overflow-hidden",
        isFeatured ? "bg-[#0F172A] rounded-none relative shadow-md" : "bg-transparent"
      )}
    >
      {/* Background Spotlight Image (Featured Only) */}
      {isFeatured && (
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
          <Image
            src="/spotlight.png"
            alt="Spotlight Background"
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      {/* Featured Award Header */}
      {isFeatured && awardDateLabel && (
        <div className="relative z-10 flex flex-row items-center justify-between w-full mb-5 px-1 md:px-0">
          <div className="flex items-center gap-2">
            <div className="w-[18px] h-[3px] bg-sydeorange rounded-full" />
            <span className="font-['Paperlogy'] font-extrabold text-[14px] md:text-[16px] text-white tracking-tight">
              SYDE Pick - {awardDateLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <SydePickInfoDialog />
            <SydePickBadge awards={showcase.showcase_awards} size={24} />
          </div>
        </div>
      )}

      {/* Media + Content Wrapper */}
      <div
        className={cn(
          "relative z-10 flex flex-row gap-3 md:gap-4 items-start cursor-pointer w-full",
          isFeatured ? "group" : ""
        )}
        onClick={handleCardClick}
      >
        {/* Thumbnail (Mobile: 80x80 / Desktop: 120x120) */}
        <ShowcaseThumbnail
          src={showcase.thumbnail_url}
          alt={showcase.name || "Showcase"}
          containerClassName={cn(
            "w-[80px] h-[80px] md:w-[120px] md:h-[120px] shrink-0",
            isFeatured ? "rounded-[10px] border border-white/10 shadow-xl" : "rounded-[10px]"
          )}
        />

        {/* Content Area */}
        <div className="flex flex-col justify-between md:h-[120px] min-w-0 flex-grow gap-1 md:gap-0">
          <div className="flex flex-col gap-1 md:gap-2 w-full">
            <div className="flex flex-row items-center justify-between gap-4 w-full">
              {/* Title (Mobile: 16px / Desktop: 20px Bold) */}
              <h3 className={cn(
                "text-[16px] md:text-[20px] font-bold line-clamp-1 leading-[150%] md:leading-[27px] flex-1 min-w-0",
                isFeatured ? "text-white" : "text-black"
              )}>
                {showcase.name || "제목 없음"}
              </h3>
              <div onClick={(e) => e.stopPropagation()} className={cn("shrink-0 flex items-center", isFeatured ? "hidden" : "flex")}>
                <SydePickBadge awards={showcase.showcase_awards} size={24} />
              </div>
            </div>
            {/* Description (Mobile: 13px / Desktop: 15px) */}
            <p className={cn(
              "text-[13px] md:text-[15px] font-normal line-clamp-1 leading-[150%] md:leading-[21px]",
              isFeatured ? "text-white/70" : "text-black"
            )}>
              {showcase.short_description || "설명이 없습니다."}
            </p>
            {/* Profile Line (Mobile: 13px/11px / Desktop: 14px/12px) */}
            <div className="h-5 w-full relative">
              <ProfileHoverCard
                userId={showcase.user_id}
                profileData={showcase.profiles}
              >
                <div className="flex items-center gap-[5px] h-5">
                  <div className="relative w-5 h-5 overflow-hidden shrink-0 bg-[#D9D9D9] rounded-full border border-white/5">
                    <Image
                      src={showcase.profiles?.avatar_url || "/default_avatar.png"}
                      alt="author"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className={cn(
                    "text-[13px] md:text-[14px] font-semibold leading-tight whitespace-nowrap",
                    isFeatured ? "text-white/90" : "text-sydeblue"
                  )}>
                    {showcase.profiles?.full_name ||
                      showcase.profiles?.username}
                  </span>
                  <span className={cn(
                    "text-[11px] md:text-[12px] font-normal leading-tight truncate flex-grow",
                    isFeatured ? "text-white/40" : "text-[#777777]"
                  )}>
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
              variant={variant}
            />
          </div>
        </div>
      </div>

      {/* Actions (Mobile: Bottom row) */}
      <div
        className="md:hidden w-full h-[28px] relative z-10"
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
          variant={variant}
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
