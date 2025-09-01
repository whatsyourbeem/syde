"use client";

import { useState } from "react";
import { Tables, Enums } from "@/types/database.types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Crown, EllipsisVertical } from "lucide-react";
import { toast } from "sonner";
import { leaveClub } from "@/app/socialing/club/actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CLUB_MEMBER_ROLES,
  CLUB_MEMBER_ROLE_DISPLAY_NAMES,
} from "@/lib/constants";

type Profile = Tables<"profiles">;
type ClubMember = Tables<"club_members"> & { profiles: Profile | null };

const ROLE_ORDER: Record<Enums<"club_member_role_enum">, number> = {
  [CLUB_MEMBER_ROLES.LEADER]: 0,
  [CLUB_MEMBER_ROLES.FULL_MEMBER]: 1,
  [CLUB_MEMBER_ROLES.GENERAL_MEMBER]: 2,
};

interface ClubMembersListProps {
  members: ClubMember[];
  clubId: string;
  currentUserId?: string;
  clubOwnerId: string;
  direction?: "vertical" | "horizontal"; // Added new prop
}

export default function ClubMembersList({
  members,
  clubId,
  currentUserId,
  clubOwnerId,
  direction = "vertical", // Default to vertical
}: ClubMembersListProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentMember = members.find(
    (member) => member.user_id === currentUserId
  );

  const groupedMembers: Record<Enums<"club_member_role_enum">, ClubMember[]> = {
    [CLUB_MEMBER_ROLES.LEADER]: [],
    [CLUB_MEMBER_ROLES.FULL_MEMBER]: [],
    [CLUB_MEMBER_ROLES.GENERAL_MEMBER]: [],
  };

  members.forEach((member) => {
    if (member.role) {
      groupedMembers[member.role].push(member);
    }
  });

  // Sort members within each group alphabetically
  Object.values(groupedMembers).forEach((group) => {
    group.sort((a, b) => {
      const aName = a.profiles?.full_name || a.profiles?.username || "";
      const bName = b.profiles?.full_name || b.profiles?.username || "";
      return aName.localeCompare(bName);
    });
  });

  // Sort groups by ROLE_ORDER
  const sortedRoles = Object.keys(groupedMembers).sort((a, b) => {
    return (
      ROLE_ORDER[a as Enums<"club_member_role_enum">] -
      ROLE_ORDER[b as Enums<"club_member_role_enum">]
    );
  }) as Enums<"club_member_role_enum">[];

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
      
      <div
        className={`flex ${
          direction === "vertical" ? "flex-col gap-4" : "flex-row gap-4"
        }`}
      >
        {direction === "horizontal" ? (
          // Horizontal display for mobile
          (() => {
            const MAX_HORIZONTAL_DISPLAY = 10;
            let tempMembers = [...members];
            const displayMembers: ClubMember[] = [];

            const currentUser = tempMembers.find(
              (member) => member.user_id === currentUserId
            );
            const ownerUser = tempMembers.find(
              (member) => member.user_id === clubOwnerId
            );

            // 1. Add current user first
            if (currentUser) {
              displayMembers.push(currentUser);
              tempMembers = tempMembers.filter(
                (member) => member.user_id !== currentUser.user_id
              );
            }

            // 2. Add owner second (if not current user)
            if (ownerUser && ownerUser.user_id !== currentUser?.user_id) {
              displayMembers.push(ownerUser);
              tempMembers = tempMembers.filter(
                (member) => member.user_id !== ownerUser.user_id
              );
            }

            // 3. Add remaining members up to MAX_HORIZONTAL_DISPLAY
            let count = displayMembers.length;
            for (const member of tempMembers) {
              if (count >= MAX_HORIZONTAL_DISPLAY) break;
              displayMembers.push(member);
              count++;
            }

            return displayMembers.map((member) => (
              <ProfileHoverCard
                key={member.profiles?.id}
                userId={member.user_id}
                profileData={member.profiles}
              >
                <Link href={`/${member.profiles?.username}`} className="block">
                  <div className={`flex flex-col items-center flex-shrink-0 w-32 border rounded-md p-2 ${member.user_id === currentUserId ? "bg-gray-50" : ""}`}>
                    <div className="relative">
                      <Avatar className="size-12">
                        <AvatarImage
                          src={member.profiles?.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {member.profiles?.username?.charAt(0).toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      {member.user_id === clubOwnerId && (
                        <Crown className="absolute -top-1 -left-1 size-6 text-yellow-500 fill-yellow-500 bg-white rounded-full p-0.5" />
                      )}
                    </div>
                    <p className="font-semibold text-xs text-center mt-1 w-full truncate items-center justify-center">
                      {member.profiles?.full_name || member.profiles?.username}
                    </p>
                    <p className="text-xs text-muted-foreground text-center w-full truncate">
                      @{member.profiles?.username || member.user_id}
                    </p>
                    <p className="text-xs text-muted-foreground text-center w-full truncate h-[1rem]">
                      {member.profiles?.tagline || " "}
                    </p>
                  </div>
                </Link>
              </ProfileHoverCard>
            ));
          })()
        ) : (
          // Original vertical display for desktop
          <>
            {currentMember && (
              <ProfileHoverCard
                key={currentMember.profiles?.id}
                userId={currentMember.user_id}
                profileData={currentMember.profiles}
                disableHover={true}
              >
                <div className="flex items-center justify-between rounded-md p-2 bg-gray-50 mt-4">
                  <div className="flex items-center gap-x-2">
                    <Link href={`/${currentMember.profiles?.username}`}>
                      <div className="relative">
                        <Avatar className="size-7">
                          <AvatarImage
                            src={currentMember.profiles?.avatar_url || undefined}
                          />
                          <AvatarFallback>
                            {currentMember.profiles?.username
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {currentMember.user_id === clubOwnerId && (
                          <Crown className="absolute -top-1 -left-1 size-4 text-yellow-500 fill-yellow-500 bg-white rounded-full p-0.5" />
                        )}
                      </div>
                    </Link>
                    <div className="text-left">
                      <Link href={`/${currentMember.profiles?.username}`}>
                        <p className="font-semibold text-sm hover:underline line-clamp-1">
                          {currentMember.profiles?.full_name ||
                            currentMember.profiles?.username}
                        </p>
                      </Link>
                    </div>
                  </div>
                  {currentUserId === currentMember.user_id &&
                    currentUserId !== clubOwnerId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <EllipsisVertical className="size-2 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setShowConfirmDialog(true)}
                            disabled={isLoading}
                            className="text-red-500"
                          >
                            {isLoading ? (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                              <LogOut className="mr-2 size-4" />
                            )}
                            <span>
                              {isLoading ? "탈퇴 처리 중..." : "탈퇴하기"}
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </div>
              </ProfileHoverCard>
            )}

            <div className="flex items-center justify-between mt-2">
              <h3 className="font-bold">멤버 {members.length}</h3>
            </div>

            <Accordion
              type="multiple"
              className="w-full"
              defaultValue={sortedRoles}
            >
              {sortedRoles.map((role) => {
                const membersInRole = groupedMembers[role];
                if (membersInRole.length === 0) return null;

                return (
                  <AccordionItem value={role} key={role}>
                    <AccordionTrigger className="text-xs font-semibold pt-2">
                      <div className="flex items-center gap-1 flex-grow">
                        {CLUB_MEMBER_ROLE_DISPLAY_NAMES[role]}
                        <span className="text-muted-foreground">
                          ({membersInRole.length})
                        </span>
                        <div className="flex-grow border-b border-gray-300 ml-2"></div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2 py-2">
                        {membersInRole.map((member) => (
                          <ProfileHoverCard
                            key={member.profiles?.id}
                            userId={member.user_id}
                            profileData={member.profiles}
                          >
                            <Link href={`/${member.profiles?.username}`} className="block">
                              <div className={`border rounded-md p-2 ${member.user_id === currentUserId ? "bg-gray-50" : ""}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-x-2">
                                    <div className="relative">
                                      <Avatar className="size-7">
                                        <AvatarImage
                                          src={
                                            member.profiles?.avatar_url || undefined
                                          }
                                        />
                                        <AvatarFallback>
                                          {member.profiles?.username
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      {member.user_id === clubOwnerId && (
                                        <Crown className="absolute -top-1 -left-1 size-4 text-yellow-500 fill-yellow-500 bg-white rounded-full p-0.5" />
                                      )}
                                    </div>
                                    <div className="text-left">
                                      <p className="font-semibold text-sm hover:underline line-clamp-1">
                                        {member.profiles?.full_name ||
                                          member.profiles?.username}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        @{member.profiles?.username || member.user_id}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1 h-[1rem] mt-1">
                                  {member.profiles?.tagline || " "}
                                </p>
                              </div>
                            </Link>
                          </ProfileHoverCard>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>클럽 탈퇴</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 클럽을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <AlertDialogAction
              onClick={handleLeaveClub}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                "탈퇴하기"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
