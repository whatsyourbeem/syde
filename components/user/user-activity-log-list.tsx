"use client";

import { useState } from "react";
import { LogList } from "@/components/log/log-list";
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
          <SelectItem value="bookmarked">북마크한 로그</SelectItem>
          <SelectItem value="liked">좋아요한 로그</SelectItem>
          <SelectItem value="commented">댓글 단 로그</SelectItem>
        </SelectContent>
      </Select>
      {filterType === "liked" && (
        <LogList currentUserId={currentUserId} filterByLikedUserId={userId} />
      )}
      {filterType === "commented" && (
        <LogList currentUserId={currentUserId} filterByCommentedUserId={userId} />
      )}
      {filterType === "bookmarked" && (
        <LogList currentUserId={currentUserId} filterByBookmarkedUserId={userId} />
      )}
    </div>
  );
}