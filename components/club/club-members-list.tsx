
"use client";

import { useState, useEffect } from "react";
import { Tables } from "@/types/database.types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2, LogOut, Crown } from "lucide-react";
import { toast } from "sonner";
import { leaveClub } from "@/app/socialing/club/actions";

type Profile = Tables<'profiles'>;
type ClubMember = Tables<'club_members'> & { profiles: Profile | null };

interface ClubMembersListProps {
  members: ClubMember[];
  clubId: string;
  currentUserId?: string;
  clubOwnerId: string;
}

export default function ClubMembersList({ members, clubId, currentUserId, clubOwnerId }: ClubMembersListProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentMember = members.find(member => member.user_id === currentUserId);

  const sortedMembers = [...members].sort((a, b) => {
    const aId = a.user_id;
    const bId = b.user_id;

    // Current user first
    if (aId === currentUserId) return -1;
    if (bId === currentUserId) return 1;

    // Owner second (if not current user)
    if (aId === clubOwnerId) return -1;
    if (bId === clubOwnerId) return 1;

    // Alphabetical by full_name or username for others
    const aName = a.profiles?.full_name || a.profiles?.username || '';
    const bName = b.profiles?.full_name || b.profiles?.username || '';
    return aName.localeCompare(bName);
  });

  const handleLeaveClub = async () => {
    setIsLoading(true);
    try {
      const result = await leaveClub(clubId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("클럽에서 탈퇴했습니다.");
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      toast.error("클럽 탈퇴 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between my-4">
        <h3 className="font-bold">멤버 ({members.length})</h3>
        {currentMember && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowConfirmDialog(true)} disabled={isLoading} className="text-red-500">
                {isLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 size-4" />
                )}
                <span>{isLoading ? "탈퇴 처리 중..." : "탈퇴하기"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {members.length > 0 ? (
        <div className="flex flex-col gap-4">
          {sortedMembers.map((member) => (
            <ProfileHoverCard key={member.profiles?.id} userId={member.user_id} profileData={member.profiles}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-3">
                  <Link href={`/${member.profiles?.username}`}>
                    <Avatar className="size-7">
                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                      <AvatarFallback>{member.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="text-left">
                    <Link href={`/${member.profiles?.username}`}>
                      <p className="font-semibold text-sm hover:underline flex items-center">
                        <span>{member.profiles?.full_name || member.profiles?.username}</span>
                        {member.user_id === clubOwnerId && <Crown className="ml-2 size-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                        {member.user_id === currentUserId && <span className="ml-1 text-muted-foreground flex-shrink-0">(me)</span>}
                      </p>
                    </Link>
                  </div>
                </div>
                {/* Removed individual member dropdown */}
              </div>
            </ProfileHoverCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>클럽 멤버가 아직 없습니다.</p>
        </div>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>클럽 탈퇴</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 클럽을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isLoading}>
              취소
            </Button>
            <AlertDialogAction onClick={handleLeaveClub} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white">
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : "탈퇴하기"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
