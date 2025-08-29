"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UserPlus, Edit, Settings, CalendarPlus } from "lucide-react";
import { joinClub } from "@/app/socialing/club/actions";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import Image from "next/image";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { Database } from "@/types/database.types";
import { CLUB_MEMBER_ROLE_DISPLAY_NAMES, ClubMemberRole } from "@/lib/constants";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ClubSidebarInfoProps {
  clubName: string;
  clubTagline?: string;
  clubId: string;
  clubThumbnailUrl?: string;
  ownerProfile: Profile | null;
  isMember: boolean;
  isOwner: boolean;
  currentUserId?: string;
  userRole: string | null;
}

export default function ClubSidebarInfo({
  clubName,
  clubTagline,
  clubId,
  clubThumbnailUrl,
  ownerProfile,
  isMember,
  isOwner,
  currentUserId,
  userRole,
}: ClubSidebarInfoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { openLoginDialog } = useLoginDialog();

  const handleJoinClub = async () => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }
    setIsLoading(true);
    try {
      const result = await joinClub(clubId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("클럽에 가입되었습니다.");
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      toast.error("클럽 가입 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-white">
      <Link href={`/socialing/club/${clubId}`}>
        <div className="relative w-24 h-24 mb-4 mx-auto">
          <Image
            src={clubThumbnailUrl || "/default_club_thumbnail.png"}
            alt={`${clubName} thumbnail`}
            fill
            className="rounded-full object-cover"
          />
        </div>
      </Link>
      <Link href={`/socialing/club/${clubId}`}>
        <h1 className="text-2xl font-bold mb-2 text-start hover:underline">{clubName}</h1>
      </Link>
      {clubTagline && (
        <p className="text-base text-muted-foreground mb-2">{clubTagline}</p>
      )}
      
      <div className="flex flex-col mt-4 gap-2">
        {ownerProfile && (
          <ProfileHoverCard userId={ownerProfile.id} profileData={ownerProfile}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href={`/${ownerProfile?.username}`}>
                <Avatar className="size-6">
                  <AvatarImage src={ownerProfile?.avatar_url || undefined} />
                  <AvatarFallback>{ownerProfile?.username?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </Link>
              <Link href={`/${ownerProfile?.username}`} className="hover:underline">
                <span className="font-semibold text-primary">{ownerProfile?.full_name || ownerProfile?.username}</span>
                <span className="ml-2">클럽장</span>
              </Link>
            </div>
          </ProfileHoverCard>
        )}

        {userRole && <Badge variant="secondary" className="w-fit">내 등급: {CLUB_MEMBER_ROLE_DISPLAY_NAMES[userRole as ClubMemberRole]}</Badge>}

        <div className="flex flex-col gap-2 mt-4">
          {isOwner && (
            <>
              <Button asChild variant="outline">
                <Link href={`/socialing/club/${clubId}/edit`}>
                  <Edit className="mr-2 size-4" /> 클럽 정보 수정
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/socialing/meetup/create?club_id=${clubId}`}>
                  <CalendarPlus className="mr-2 size-4" /> 모임 만들기
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/socialing/club/${clubId}/manage`}>
                  <Settings className="mr-2 size-4" /> 게시판 관리
                </Link>
              </Button>
            </>
          )}
          {!isMember && (
            <Button onClick={handleJoinClub} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
              {isLoading ? "처리 중..." : "클럽 가입"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
