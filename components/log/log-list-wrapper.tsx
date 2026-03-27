"use client";

import { useSearchParams } from "next/navigation";
import { LogList } from "@/components/log/log-list";
import { LogCreateButton } from "@/components/log/log-create-button";
import { Database } from "@/types/database.types";
import { FeedQueryResult } from "@/lib/queries/feed-queries";

interface LogListWrapperProps {
  user: Database["public"]["Tables"]["profiles"]["Row"] | null;
  avatarUrl: string | null;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  searchQuery?: string;
  initialFeed?: FeedQueryResult;
}

export function LogListWrapper({
  user,
  avatarUrl,
  filterByUserId,
  filterByCommentedUserId,
  filterByLikedUserId,
  initialFeed,
}: LogListWrapperProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  return (
    <div className="space-y-6">
      {!filterByUserId &&
        !filterByCommentedUserId &&
        !filterByLikedUserId &&
        !searchQuery && (
        <LogCreateButton user={user} avatarUrl={avatarUrl} />
      )}
      <LogList
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