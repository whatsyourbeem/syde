'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import ClubList from './club-list';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 10;

interface ClubSearchListProps {
  searchQuery: string;
}

export function ClubSearchList({ searchQuery }: ClubSearchListProps) {
  const supabase = createClient();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['clubs', 'search', searchQuery, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('clubs')
        .select(`
          *,
          owner_profile:profiles!owner_id(*),
          member_count:club_members(count),
          members:club_members(profiles(*))
        `, { count: 'exact' });

      if (searchQuery) {
        const escaped = searchQuery.replace(/"/g, '\\"');
        query = query.or(`name.ilike."%${escaped}%",tagline.ilike."%${escaped}%"`);
      }

      const { data: clubsData, error: clubsError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (clubsError) throw clubsError;

      const formattedClubs = (clubsData || []).map((club: any) => ({
        ...club,
        member_count: club.member_count[0]?.count || 0,
        members: club.members.map((m: any) => m.profiles).filter(Boolean),
      }));

      return {
        clubs: formattedClubs,
        count: count || 0,
      };
    },
  });

  if (isLoading) return <div className="text-center py-10">클럽 검색 중...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Error: {(error as Error).message}</div>;

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {data?.clubs.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">검색 결과가 없습니다.</p>
      ) : (
        <ClubList clubs={data?.clubs || []} />
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
