
"use client";

import { Tables } from "@/types/database.types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileHoverCard from "@/components/common/profile-hover-card";

type Profile = Tables<'profiles'>;
type ClubMember = Tables<'club_members'> & { profiles: Profile | null };

interface ClubMembersListProps {
  members: ClubMember[];
}

export default function ClubMembersList({ members }: ClubMembersListProps) {
  return (
    <div>
      <h3 className="font-bold my-4">멤버 ({members.length})</h3>
      {members.length > 0 ? (
        <div className="flex flex-col gap-4">
          {members.map((member) => (
            <ProfileHoverCard key={member.profiles?.id} userId={member.user_id} profileData={member.profiles}>
              <div className="flex items-center gap-3">
                <Link href={`/${member.profiles?.username}`}>
                  <Avatar className="size-8">
                    <AvatarImage src={member.profiles?.avatar_url || undefined} />
                    <AvatarFallback>{member.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="text-left">
                  <Link href={`/${member.profiles?.username}`}>
                    <p className="font-semibold text-sm hover:underline">{member.profiles?.full_name || member.profiles?.username}</p>
                  </Link>
                </div>
              </div>
            </ProfileHoverCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>클럽 멤버가 아직 없습니다.</p>
        </div>
      )}
    </div>
  );
}
