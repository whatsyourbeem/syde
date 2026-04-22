"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { InsightCard } from "@/components/insight/insight-card";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { fetchInsightsAction, InsightQueryResult } from "@/app/insight/insight-data-actions";

const ITEMS_PER_PAGE = 18;

interface InsightFeedProps {
  initialInsights: InsightQueryResult;
  currentUserId: string | null;
}

export function InsightFeed({ initialInsights, currentUserId }: InsightFeedProps) {
  const router = useRouter();
  const { openLoginDialog } = useLoginDialog();

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
    staleTime: 60000,
  });

  const allInsights = data?.pages.flatMap((page) => page.insights) || [];

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-3 md:px-0 py-[6px] md:py-8">
      {allInsights.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-x-9 md:gap-y-14 justify-items-center w-full">
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
          <p>작성된 인사이트가 없습니다.</p>
          <p className="text-xs">첫 번째 인사이트의 주인공이 되어보세요!</p>
        </div>
      )}

      {/* Floating Create Button */}
      <Button
        onClick={() => {
          if (!currentUserId) {
            openLoginDialog();
          } else {
            router.push("/insight/write");
          }
        }}
        className="fixed bottom-10 right-10 w-14 h-14 rounded-full bg-sydeblue hover:bg-sydeblue/90 shadow-xl flex items-center justify-center p-0 z-50"
      >
        <Plus className="w-8 h-8 text-white" />
      </Button>
    </div>
  );
}
