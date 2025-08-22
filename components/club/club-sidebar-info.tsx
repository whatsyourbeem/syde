"use client";

import { useState } from "react";
import { Tables } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, LogOut, UserPlus } from "lucide-react";
import { joinClub, leaveClub } from "@/app/socialing/club/actions";
import Link from "next/link"; // Assuming Link might be needed for edit button
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Profile = Tables<'profiles'>;
type Club = Tables<'clubs'> & { owner_profile: Profile | null };

interface ClubSidebarInfoProps {
  club: Club;
  isMember: boolean;
  currentUserId?: string;
  userRole: string | null;
}

export default function ClubSidebarInfo({ club, isMember, currentUserId, userRole }: ClubSidebarInfoProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinClub = async () => {
    if (!currentUserId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await joinClub(club.id);
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

  const handleLeaveClub = async () => {
    if (!currentUserId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await leaveClub(club.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("클럽에서 탈퇴했습니다.");
      }
    } catch (error) {
      console.error(error);
      toast.error("클럽 탈퇴 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = currentUserId === club.owner_id;

  return (
    <div className="p-4 rounded-lg bg-white">
      <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
      {club.tagline && (
        <p className="text-lg text-muted-foreground mb-4">{club.tagline}</p>
      )}
      
      <div className="flex flex-row md:flex-col   md:gap-2"> {/* Main responsive container */}
        {/* Owner Info (Left on mobile, top on desktop) */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="size-6">
            <AvatarImage src={club.owner_profile?.avatar_url || undefined} />
            <AvatarFallback>{club.owner_profile?.username?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <Link href={`/${club.owner_profile?.username}`} className="hover:underline">
            <span className="font-semibold text-primary">{club.owner_profile?.full_name || club.owner_profile?.username}</span>
            <span className="ml-1">클럽장</span>
          </Link>
        </div>

        {/* Badge and Buttons (Right on mobile, bottom on desktop) */}
        <div className="flex items-center gap-2 mt-2 md:mt-0 ml-auto"> {/* ml-auto pushes to right on mobile */}
          {userRole && <Badge variant="secondary">내 등급: {userRole}</Badge>}
          {isOwner ? (
            <div className="flex items-center gap-2">
              <Link href={`/socialing/club/${club.id}/edit`}>
                <Button variant="outline" className="w-fit">클럽정보수정</Button>
              </Link>
            </div>
          ) : isMember ? (
            <Button variant="outline" onClick={handleLeaveClub} disabled={isLoading} className="w-fit">
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <LogOut className="mr-2 size-4" />}
              {isLoading ? "처리 중..." : "클럽 탈퇴"}
            </Button>
          ) : (
            <Button onClick={handleJoinClub} disabled={isLoading} className="w-fit">
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
              {isLoading ? "처리 중..." : "클럽 가입"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
