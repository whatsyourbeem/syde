"use client";

import { useState } from "react";
import { FeedList } from "@/components/feed/feed-list";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserActivityLogListProps {
  currentUserId: string | null;
  userId: string; // The profile owner's ID
}

export function UserActivityLogList({ currentUserId, userId }: UserActivityLogListProps) {
  const [filterType, setFilterType] = useState<"liked" | "commented" | "bookmarked">("bookmarked");

  return (
    <div className="space-y-4">
      <Select value={filterType} onValueChange={(value: "liked" | "commented" | "bookmarked") => setFilterType(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="필터 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bookmarked">북마크한 피드</SelectItem>
          <SelectItem value="liked">좋아요한 피드</SelectItem>
          <SelectItem value="commented">댓글 단 피드</SelectItem>
        </SelectContent>
      </Select>
      {filterType === "liked" && (
        <FeedList currentUserId={currentUserId} filterByLikedUserId={userId} />
      )}
      {filterType === "commented" && (
        <FeedList currentUserId={currentUserId} filterByCommentedUserId={userId} />
      )}
      {filterType === "bookmarked" && (
        <FeedList currentUserId={currentUserId} filterByBookmarkedUserId={userId} />
      )}
    </div>
  );
}