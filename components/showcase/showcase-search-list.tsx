'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ShowcaseCard } from './showcase-card';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 10;

interface ShowcaseSearchListProps {
  searchQuery: string;
}

export function ShowcaseSearchList({ searchQuery }: ShowcaseSearchListProps) {
  const supabase = createClient();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['showcases', 'search', searchQuery, currentPage],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('showcases')
        .select(`
          *,
          profiles(*),
          showcase_likes(user_id),
          showcase_bookmarks(user_id),
          showcase_comments(id)
        `, { count: 'exact' });

      if (searchQuery) {
        const escaped = searchQuery.replace(/"/g, '\\"');
        query = query.or(`name.ilike."%${escaped}%",short_description.ilike."%${escaped}%"`);
      }

      const { data: showcaseData, error: showcaseError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (showcaseError) throw showcaseError;

      const formattedShowcases = (showcaseData || []).map((item: any) => ({
        ...item,
        currentUserId: user?.id || null,
        initialLikesCount: item.showcase_likes?.length || 0,
        initialHasLiked: user ? item.showcase_likes?.some((l: any) => l.user_id === user.id) : false,
        initialBookmarksCount: item.showcase_bookmarks?.length || 0,
        initialHasBookmarked: user ? item.showcase_bookmarks?.some((b: any) => b.user_id === user.id) : false,
        initialCommentsCount: item.showcase_comments?.length || 0,
        mentionedProfiles: [], // Add if needed
      }));

      return {
        showcases: formattedShowcases,
        count: count || 0,
      };
    },
  });

  if (isLoading) return <div className="text-center py-10">쇼케이스 검색 중...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Error: {(error as Error).message}</div>;

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {data?.showcases.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">검색 결과가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {data?.showcases.map((item: any) => (
            <ShowcaseCard 
              key={item.id} 
              showcase={item}
              currentUserId={item.currentUserId}
              initialLikesCount={item.initialLikesCount}
              initialHasLiked={item.initialHasLiked}
              initialBookmarksCount={item.initialBookmarksCount}
              initialHasBookmarked={item.initialHasBookmarked}
              initialCommentsCount={item.initialCommentsCount}
              mentionedProfiles={item.mentionedProfiles}
            />
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
