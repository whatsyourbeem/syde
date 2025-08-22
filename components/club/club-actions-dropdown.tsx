"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { leaveClub } from "@/app/socialing/club/actions";

interface ClubActionsDropdownProps {
  clubId: string;
  isOwner: boolean;
  isMember: boolean;
  currentUserId?: string;
}

export default function ClubActionsDropdown({
  clubId,
  isOwner,
  isMember,
  currentUserId,
}: ClubActionsDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLeaveClub = async () => {
    if (!currentUserId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await leaveClub(clubId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("클럽에서 탈퇴했습니다.");
        window.location.reload(); // Reload to reflect membership change
      }
    } catch (error) {
      console.error(error);
      toast.error("클럽 탈퇴 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-end items-center p-2 border-b border-gray-200">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwner && (
            <>
              <DropdownMenuItem asChild>
                <Link href={`/socialing/club/${clubId}/edit`}>
                  클럽 정보 수정
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/socialing/club/${clubId}/manage`}>
                  클럽 관리
                </Link>
              </DropdownMenuItem>
            </>
          )}
          {!isOwner && isMember && (
            <DropdownMenuItem onClick={handleLeaveClub} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                "클럽 탈퇴"
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
