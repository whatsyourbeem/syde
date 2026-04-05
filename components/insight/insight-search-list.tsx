'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { InsightCard } from './insight-card';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 12;

interface InsightSearchListProps {
  searchQuery: string;
}

export function InsightSearchList({ searchQuery }: InsightSearchListProps) {
  const supabase = createClient();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['insights', 'search', searchQuery, currentPage],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('insights')
        .select(`
          *,
          author:profiles!user_id(*),
          insight_comments(id),
          insight_likes(id, user_id),
          insight_bookmarks(insight_id, user_id)
        `, { count: 'exact' });

      if (searchQuery) {
        const escaped = searchQuery.replace(/"/g, '\\"');
        query = query.or(`title.ilike."%${escaped}%",summary.ilike."%${escaped}%"`);
      }

      const { data: insightsData, error: insightsError, count } = await query
        .order('created_at', { ascending: false })
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
          hasLiked: user ? item.insight_likes?.some((l: any) => l.user_id === user.id) : false,
          hasBookmarked: user ? item.insight_bookmarks?.some((b: any) => b.user_id === user.id) : false
        },
        currentUserId: user?.id || null
      }));

      return {
        insights: formattedInsights,
        count: count || 0,
      };
    },
  });

  if (isLoading) return <div className="text-center py-10">인사이트 검색 중...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Error: {(error as Error).message}</div>;

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {data?.insights.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">검색 결과가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {data?.insights.map((insight) => (
            <InsightCard key={insight.id} {...insight} />
          ))}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              variant={currentPage === i + 1 ? 'default' : 'outline'}
              size="sm"
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
