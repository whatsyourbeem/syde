'use client';

import { useSearchParams } from 'next/navigation';
import { LogList } from "@/components/log/log-list";

interface LogListWrapperProps {
  currentUserId: string | null;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  searchQuery?: string;
}

export function LogListWrapper({
  currentUserId,
  filterByUserId,
  filterByCommentedUserId,
  filterByLikedUserId,
}: LogListWrapperProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  return (
    <LogList
      currentUserId={currentUserId}
      filterByUserId={filterByUserId}
      filterByCommentedUserId={filterByCommentedUserId}
      filterByLikedUserId={filterByLikedUserId}
      searchQuery={searchQuery}
    />
  );
}
