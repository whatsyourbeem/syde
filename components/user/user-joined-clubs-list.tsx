"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CLUB_MEMBER_ROLE_DISPLAY_NAMES } from "@/lib/constants";

type Club = Database["public"]["Tables"]["clubs"]["Row"];
type ClubMemberRole = Database["public"]["Enums"]["club_member_role_enum"];

interface ClubWithMemberInfo extends Club {
  member_role: ClubMemberRole;
}

interface UserJoinedClubsListProps {
  userId: string;
}

export function UserJoinedClubsList({ userId }: UserJoinedClubsListProps) {
  const [clubs, setClubs] = useState<ClubWithMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJoinedClubs = async () => {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from("club_members")
          .select(`
            role,
            clubs:club_id (
              id,
              name,
              description,
              thumbnail_url,
              created_at,
              owner_id,
              tagline,
              updated_at
            )
          `)
          .eq("user_id", userId);

        if (error) {
          console.error("Error fetching joined clubs:", error);
          setError("클럽 목록을 불러오는데 실패했습니다.");
          return;
        }

        const clubsWithRole = data
          ?.filter((item) => item.clubs)
          .map((item) => ({
            ...item.clubs!,
            member_role: item.role,
          })) || [];

        setClubs(clubsWithRole);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("예기치 않은 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedClubs();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        가입 클럽 목록을 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        {error}
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        가입한 클럽이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clubs.map((club) => (
        <Link
          key={club.id}
          href={`/socialing/club/${club.id}`}
          className="block p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              {club.thumbnail_url ? (
                <Image
                  src={club.thumbnail_url}
                  alt={club.name}
                  fill
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold text-lg">
                  {club.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{club.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {CLUB_MEMBER_ROLE_DISPLAY_NAMES[club.member_role]}
                </Badge>
              </div>
              {club.tagline && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {club.tagline}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                가입일: {new Date(club.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}