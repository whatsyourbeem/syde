"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchShowcasesAction } from "@/app/showcase/showcase-data-actions";
import { OptimizedShowcase } from "@/lib/queries/showcase-queries";
import Link from "next/link";
import Image from "next/image";
import { ShowcaseCard } from "@/components/showcase/showcase-card";
import { ShowcaseThumbnail } from "@/components/showcase/showcase-thumbnail";

interface UserShowcaseListProps {
  userId: string;
  variant?: "default" | "compact";
  currentUserId: string | null;
}

export function UserShowcaseList({
  userId,
  variant = "default",
  currentUserId,
}: UserShowcaseListProps) {
  const supabase = createClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-showcases", userId, variant],
    queryFn: () =>
      fetchShowcasesAction({
        currentUserId,
        currentPage: 1,
        showcasesPerPage: variant === "compact" ? 10 : 20,
        filterByParticipantUserId: userId,
      }),
    staleTime: 30000,
  });

  const showcases: OptimizedShowcase[] = useMemo(
    () => data?.showcases || [],
    [data?.showcases]
  );

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        쇼케이스 목록을 불러오는 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 py-8">
        쇼케이스 목록을 불러오는데 실패했습니다.
      </div>
    );
  }

  if (showcases.length === 0) {
    if (variant === "compact") {
      return (
        <div className="flex items-center justify-center h-[81px] text-center px-4">
          <p className="text-[#777777] text-sm font-light leading-[150%]">
            아직 등록된 쇼케이스가 없어요.<br />
            당신의 멋진 프로덕트를 이곳에 보여주세요.
          </p>
        </div>
      );
    }
    return (
      <div className="text-center text-muted-foreground py-8">
        등록된 쇼케이스가 없습니다.
      </div>
    );
  }

  if (variant === "compact") {
    const displayShowcases = showcases.slice(0, 3);
    const hasMore = showcases.length > 3;

    return (
      <div className="flex items-center gap-4 py-2 px-1">
        {displayShowcases.map((showcase) => (
          <Link
            key={showcase.id}
            href={`/showcase/${showcase.id}`}
            className="flex flex-col items-center gap-2 group"
          >
            <ShowcaseThumbnail
              src={showcase.thumbnail_url}
              alt={showcase.name || ""}
              containerClassName="w-20 h-20 rounded-xl"
              className="group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-[11px] font-semibold text-black text-center line-clamp-1 w-20">
              {showcase.name}
            </span>
          </Link>
        ))}
        {hasMore && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-xl bg-[#F1F1F1] flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="flex gap-0.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-[#434343]" />
                ))}
              </div>
            </div>
            <span className="text-[11px] font-medium text-black">더보기</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showcases.map((showcase) => (
        <ShowcaseCard
          key={showcase.id}
          showcase={showcase}
          currentUserId={currentUserId}
          initialUpvotesCount={showcase.upvotesCount}
          initialHasUpvoted={showcase.hasUpvoted}
          initialCommentsCount={showcase.showcase_comments.length}
          initialViewsCount={showcase.views_count || 0}
          mentionedProfiles={data?.mentionedProfiles || []}
          isDetailPage={false}
        />
      ))}
    </div>
  );
}
