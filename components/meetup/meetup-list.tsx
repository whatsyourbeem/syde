"use client";

import { ListEmptyState } from "@/components/common/list-empty-state";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LIST_STALE_TIME } from "@/lib/queries/query-keys";
import { InfiniteScrollTrigger } from "@/components/common/infinite-scroll-trigger";
import MeetupCard from "@/components/meetup/meetup-card";
import { fetchMeetupsAction } from "@/app/meetup/meetup-data-actions";

const MEETUPS_PER_PAGE = 12;

interface MeetupListProps {
  initialMeetups: {
    meetups: any[];
    nextCursor: string | null;
  };
  status?: string;
}

export function MeetupList({ initialMeetups, status }: MeetupListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } =
    useInfiniteQuery({
      queryKey: ["meetups", "list", status ?? "전체"],
      queryFn: ({ pageParam }) =>
        fetchMeetupsAction({
          cursor: pageParam,
          meetupsPerPage: MEETUPS_PER_PAGE,
          status,
        }),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: {
        pages: [initialMeetups],
        pageParams: [null],
      },
      staleTime: LIST_STALE_TIME,
    });

  const allMeetups = data?.pages.flatMap((page) => page.meetups) ?? [];

  if (allMeetups.length === 0) {
    return (
      <ListEmptyState>
        {status ? `‘${status}’ 상태의 모임이 없어요.` : "아직 등록된 모임이 없어요."}
      </ListEmptyState>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 p-4 w-full">
        {allMeetups.map((meetup, index) => (
          <MeetupCard key={meetup.id} meetup={meetup} priority={index < 4} />
        ))}
      </div>
      <InfiniteScrollTrigger
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isError={isFetchNextPageError}
      />
    </div>
  );
}
