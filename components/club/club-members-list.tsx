
"use client";

import { Tables } from "@/types/database.types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Profile = Tables<'profiles'>;
type ClubMember = Tables<'club_members'> & { profiles: Profile | null };

interface ClubMembersListProps {
  members: ClubMember[];
}

export default function ClubMembersList({ members }: ClubMembersListProps) {
  return (
    <div className="p-4 rounded-lg shadow bg-white">
      <h3 className="font-bold mb-4">멤버 ({members.length})</h3>
      {members.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {members.map((member) => (
            <Link href={`/${member.profiles?.username}`} key={member.profiles?.id} className="flex flex-col items-center gap-2 p-2 border rounded-lg hover:shadow-md transition-shadow text-center">
              <Avatar className="size-12">
                <AvatarImage src={member.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xl">{member.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-xs truncate">{member.profiles?.full_name || member.profiles?.username}</p>
                <p className="text-xxs text-muted-foreground">@{member.profiles?.username}</p>
              </div>
            </Link>
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
