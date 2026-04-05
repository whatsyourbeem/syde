"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { InsightCard } from "./insight-card";
import { Button } from "@/components/ui/button";
import { CenteredLoading } from "@/components/ui/loading-states";

const ITEMS_PER_PAGE = 12;

interface InsightListProps {
  currentUserId: string | null;
  userId: string;
  showInteractions?: boolean;
}

export function InsightList({ currentUserId, userId, showInteractions = true }: InsightListProps) {
  const supabase = createClient();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["insights", "user", userId, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: insightsData, error: insightsError, count } = await supabase
        .from("insights")
        .select(`
          *,
          author:profiles!user_id(*),
          insight_comments(id),
          insight_likes(id, user_id),
          insight_bookmarks(insight_id, user_id)
        `, { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (insightsError) throw insightsError;

      const formattedInsights = (insightsData || []).map((item: any) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        createdAt: item.created_at,
        imageUrl: item.image_url,
        author: {
          id: item.user_id,
          name: item.author?.full_name || item.author?.username || "알 수 없는 사용자",
          role: item.author?.tagline || "멤버",
          avatarUrl: item.author?.avatar_url
        },
        stats: {
          likes: item.insight_likes?.length || 0,
          comments: item.insight_comments?.length || 0,
          bookmarks: item.insight_bookmarks?.length || 0
        },
        initialStatus: {
          hasLiked: currentUserId ? item.insight_likes?.some((l: any) => l.user_id === currentUserId) : false,
          hasBookmarked: currentUserId ? item.insight_bookmarks?.some((b: any) => b.user_id === currentUserId) : false
        },
        currentUserId: currentUserId
      }));

      return {
        insights: formattedInsights,
        count: count || 0,
      };
    },
  });

  if (isLoading) return <div className="text-center py-10"><CenteredLoading message="인사이트 불러오는 중..." /></div>;
  if (isError) return <div className="text-center py-10 text-red-500">Error: {(error as Error).message}</div>;

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {data?.insights.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">작성된 인사이트가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4 md:px-0 justify-items-center">
          {data?.insights.map((insight) => (
            <InsightCard key={insight.id} {...insight} showInteractions={showInteractions} />
          ))}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 mb-8 pb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            이전
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              disabled={isLoading}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
