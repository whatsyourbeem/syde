"use client";

import { useState } from "react";
import { LogList } from "@/components/log-list";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserActivityLogListProps {
  currentUserId: string | null;
  userId: string; // The profile owner's ID
}

export function UserActivityLogList({ currentUserId, userId }: UserActivityLogListProps) {
  const [filterType, setFilterType] = useState<"liked" | "commented">("liked");

  return (
    <div className="space-y-4">
      <Select value={filterType} onValueChange={(value: "liked" | "commented") => setFilterType(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="필터 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="liked">좋아요한 로그</SelectItem>
          <SelectItem value="commented">댓글 단 로그</SelectItem>
        </SelectContent>
      </Select>
      {filterType === "liked" ? (
        <LogList currentUserId={currentUserId} filterByLikedUserId={userId} />
      ) : (
        <LogList currentUserId={currentUserId} filterByCommentedUserId={userId} />
      )}
    </div>
  );
}