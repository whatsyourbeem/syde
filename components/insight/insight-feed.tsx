"use client";

import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InsightCard } from "@/components/insight/insight-card";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { fetchInsightsAction, InsightQueryResult } from "@/app/insight/insight-data-actions";

const ITEMS_PER_PAGE = 18;

interface InsightFeedProps {
  initialInsights: InsightQueryResult;
  currentUserId: string | null;
  currentUser: { name: string; avatarUrl: string | null } | null;
}

export function InsightFeed({ initialInsights, currentUserId, currentUser }: InsightFeedProps) {
  const router = useRouter();
  const { openLoginDialog } = useLoginDialog();

  const startWriting = () => {
    if (!currentUserId) openLoginDialog();
    else router.push("/insight/write");
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["insights", "feed"],
    queryFn: ({ pageParam = 1 }) =>
      fetchInsightsAction({
        currentPage: pageParam,
        itemsPerPage: ITEMS_PER_PAGE,
        currentUserId,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    initialData: {
      pages: [initialInsights],
      pageParams: [1],
    },
    staleTime: 0,
  });

  const allInsights = data?.pages.flatMap((page) => page.insights) || [];

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-3 md:px-0 py-[6px] md:py-8">
      {/* Inline prompt: makes the list read as a place anyone can post, not a publication. */}
      <button
        type="button"
        onClick={startWriting}
        className="mb-8 flex w-full max-w-3xl mx-auto items-center gap-3 rounded-[12px] border border-[#E5E5E5] bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <Avatar className="size-9">
          <AvatarImage src={currentUser?.avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="text-[13px]">{currentUser?.name?.slice(0, 1) || "S"}</AvatarFallback>
        </Avatar>
        <span className="text-[14px] md:text-[15px] text-[#777777]">오늘 만들면서 있었던 일, 편하게 적어보세요</span>
      </button>

      {allInsights.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="flex w-full max-w-3xl mx-auto flex-col divide-y divide-[#F0F0F0]">
            {allInsights.map((insight) => (
              <InsightCard key={insight.id} {...insight} />
            ))}
          </div>
          {hasNextPage && (
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="outline"
              className="mt-12 rounded-full px-6 py-2 text-[0.875rem] font-[700] text-[#777777] border-[#E2E8F0] hover:bg-slate-50"
            >
              {isFetchingNextPage ? "불러오는 중..." : "더보기"}
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 flex flex-col gap-2">
          <div className="text-4xl">💭</div>
          <p>아직 글이 없어요. 첫 글을 남겨보세요</p>
        </div>
      )}

      {/* Floating Create Button: labeled so it reads as "write", and kept low on mobile so it clears card stats. */}
      <Button
        onClick={startWriting}
        className="fixed bottom-5 right-4 md:bottom-10 md:right-10 h-12 gap-1.5 rounded-full bg-sydeblue px-5 text-[15px] font-medium text-white shadow-xl hover:bg-sydeblue/90 z-50"
      >
        <Pencil className="size-4" />
        글쓰기
      </Button>
    </div>
  );
}
