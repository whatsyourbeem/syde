"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react"; // Removed LogOut
import { joinClub } from "@/app/socialing/club/actions"; // Removed leaveClub
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import Image from "next/image";
import { useLoginDialog } from "@/context/LoginDialogContext";

// type Club = Tables<'clubs'> & { owner_profile: Profile | null }; // Removed this type

interface ClubSidebarInfoProps {
  clubName: string;
  clubTagline?: string;
  clubId: string;
  clubThumbnailUrl?: string;
  ownerProfile: {
    avatar_url?: string | null;
    username?: string | null;
    full_name?: string | null;
    tagline?: string | null;
  } | null;
  isMember: boolean;
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
      const result = await joinClub(clubId); // Use clubId from props
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("클럽에 가입되었습니다.");
      }
    } catch (error) {
      console.error(error);
      toast.error("클럽 가입 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // handleLeaveClub is no longer needed here as the button was moved

  return (
    <div className="p-4 rounded-lg bg-white">
      <div className="relative w-24 h-24 mb-4 mx-auto">
        <Image
          src={clubThumbnailUrl || "/default_club_thumbnail.png"}
          alt={`${clubName} thumbnail`}
          fill
          className="rounded-full object-cover"
        />
      </div>
      <h1 className="text-2xl font-bold mb-2 text-start">{clubName}</h1>
      {clubTagline && (
        <p className="text-base text-muted-foreground mb-2">{clubTagline}</p>
      )}
      
      <div className="flex flex-row md:flex-col md:mt-4 md:gap-2"> {/* Main responsive container */}
        {/* Owner Info (Left on mobile, top on desktop) */}
        <HoverCard openDelay={350}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HoverCardTrigger asChild>
              <Link href={`/${ownerProfile?.username}`}>
                <Avatar className="size-6">
                  <AvatarImage src={ownerProfile?.avatar_url || undefined} />
                  <AvatarFallback>{ownerProfile?.username?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </Link>
            </HoverCardTrigger>
            <HoverCardTrigger asChild>
              <Link href={`/${ownerProfile?.username}`} className="hover:underline">
                <span className="font-semibold text-primary">{ownerProfile?.full_name || ownerProfile?.username}</span>
                <span className="ml-2">클럽장</span>
              </Link>
            </HoverCardTrigger>
          </div>
          <HoverCardContent className="w-80" align="start">
            <Link href={`/${ownerProfile?.username}`}>
              <div className="flex justify-start space-x-4">
                <Avatar className="size-16">
                  <AvatarImage src={ownerProfile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">{ownerProfile?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold">{ownerProfile?.full_name}</h4>
                  <p className="text-sm text-muted-foreground">@{ownerProfile?.username}</p>
                  {ownerProfile?.tagline && (
                    <p className="text-xs pt-1">{ownerProfile.tagline}</p>
                  )}
                </div>
              </div>
            </Link>
          </HoverCardContent>
        </HoverCard>

        {/* Badge and Buttons (Right on mobile, bottom on desktop) */} 
        <div className="flex items-center gap-2 mt-0 ml-auto md:ml-0 md:mt-2"> {/* ml-auto pushes to right on mobile */} 
          {userRole && <Badge variant="secondary">내 등급: {userRole}</Badge>}
          {!isMember && (
            <Button onClick={handleJoinClub} disabled={isLoading} className="w-fit md:w-full text-xs py-0">
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
              {isLoading ? "처리 중..." : "클럽 가입"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
