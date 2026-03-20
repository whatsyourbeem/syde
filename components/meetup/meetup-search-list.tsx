'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import MeetupCard from './meetup-card';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 10;

interface MeetupSearchListProps {
  searchQuery: string;
}

export function MeetupSearchList({ searchQuery }: MeetupSearchListProps) {
  const supabase = createClient();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['meetups', 'search', searchQuery, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('meetups')
        .select(`
          *,
          organizer_profile:profiles!organizer_id(*),
          clubs:clubs(*)
        `, { count: 'exact' });

      if (searchQuery) {
        const escaped = searchQuery.replace(/"/g, '\\"');
        query = query.or(`title.ilike."%${escaped}%",location.ilike."%${escaped}%",address.ilike."%${escaped}%"`);
      }

      const { data: meetupsData, error: meetupsError, count } = await query
        .order('start_datetime', { ascending: false })
        .range(from, to);

      if (meetupsError) throw meetupsError;

      return {
        meetups: meetupsData || [],
        count: count || 0,
      };
    },
  });

  if (isLoading) return <div className="text-center py-10">모임 검색 중...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Error: {(error as Error).message}</div>;

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {data?.meetups.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">검색 결과가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {data?.meetups.map((meetup) => (
            <MeetupCard key={meetup.id} meetup={meetup} />
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
