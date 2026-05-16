"use client";

import { useSearchParams } from "next/navigation";
import { FeedList } from "@/components/feed/feed-list";
import { FeedCreateButton } from "@/components/feed/feed-create-button";
import { TrendingShowcases } from "@/components/showcase/trending-showcases";
import { Database } from "@/types/database.types";
import { PublicProfile } from "@/types/profile";
import { FeedQueryResult } from "@/lib/queries/feed-queries";

interface FeedListWrapperProps {
  user: PublicProfile | null;
  avatarUrl: string | null;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  searchQuery?: string;
  initialFeed?: FeedQueryResult;
}

export function FeedListWrapper({
  user,
  avatarUrl,
  filterByUserId,
  filterByCommentedUserId,
  filterByLikedUserId,
  initialFeed,
}: FeedListWrapperProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  return (
    <div>
      {/* Mobile: Trending Leaderboard */}
      {!filterByUserId &&
        !filterByCommentedUserId &&
        !filterByLikedUserId &&
        !searchQuery && (
        <div className="flex flex-col gap-0 lg:gap-0">
          <div className="lg:hidden">
            <TrendingShowcases allowCollapse={true} />
          </div>
          <FeedCreateButton user={user} avatarUrl={avatarUrl} />
        </div>
      )}
      <FeedList
        currentUserId={user?.id || null}
        filterByUserId={filterByUserId}
        filterByCommentedUserId={filterByCommentedUserId}
        filterByLikedUserId={filterByLikedUserId}
        searchQuery={searchQuery}
        initialFeed={initialFeed}
      />
    </div>
  );
}