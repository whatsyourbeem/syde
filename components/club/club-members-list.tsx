
"use client";

import { Tables } from "@/types/database.types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

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
            <HoverCard key={member.profiles?.id} openDelay={350}>
              <div className="flex items-center gap-3">
                  <HoverCardTrigger asChild>
                    <Link href={`/${member.profiles?.username}`}>
                      <Avatar className="size-8">
                        <AvatarImage src={member.profiles?.avatar_url || undefined} />
                        <AvatarFallback>{member.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                    </Link>
                  </HoverCardTrigger>
                  <div className="text-left">
                    <HoverCardTrigger asChild>
                      <Link href={`/${member.profiles?.username}`}>
                        <p className="font-semibold text-sm hover:underline">{member.profiles?.full_name || member.profiles?.username}</p>
                      </Link>
                    </HoverCardTrigger>
                  </div>
                </div>
              <HoverCardContent className="w-80" align="start">
                <Link href={`/${member.profiles?.username}`}>
                  <div className="flex justify-start space-x-4">
                    <Avatar className="size-16">
                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">{member.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold">{member.profiles?.full_name}</h4>
                      <p className="text-sm text-muted-foreground">@{member.profiles?.username}</p>
                      {member.profiles?.tagline && (
                        <p className="text-xs pt-1">{member.profiles.tagline}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </HoverCardContent>
            </HoverCard>
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
