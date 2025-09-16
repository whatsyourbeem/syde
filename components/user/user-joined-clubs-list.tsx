"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import ClubCard from "@/components/club/club-card";

type Club = Database["public"]["Tables"]["clubs"]["Row"] & {
  owner_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  member_count: number;
  members: Database["public"]["Tables"]["profiles"]["Row"][];
};

// Type for the data returned by the Supabase query
type FetchedClubMember = {
  clubs: (Database["public"]["Tables"]["clubs"]["Row"] & {
    owner_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
    member_count: { count: number }[];
    club_members: {
      profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
    }[];
  }) | null;
};

interface UserJoinedClubsListProps {
  userId: string;
}

export function UserJoinedClubsList({ userId }: UserJoinedClubsListProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJoinedClubs = async () => {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from("club_members")
          .select(`
            clubs (
              *,
              owner_profile:profiles!clubs_owner_id_fkey(*),
              member_count:club_members(count),
              club_members(user_id, profiles(*))
            )
          `)
          .eq("user_id", userId)
          .limit(10, { foreignTable: "clubs.club_members" })
          .returns<FetchedClubMember[]>();

        if (error) {
          console.error("Error fetching joined clubs:", error);
          setError("클럽 목록을 불러오는데 실패했습니다.");
          return;
        }

        const clubsWithDetails = data
          ?.map(item => {
            if (!item.clubs) return null;
            const clubData = item.clubs;
            return {
              ...clubData,
              owner_profile: clubData.owner_profile,
              member_count: Array.isArray(clubData.member_count)
                ? clubData.member_count[0]?.count || 0
                : 0,
              members: clubData.club_members.map((m) => m.profiles).filter(Boolean) as Database["public"]["Tables"]["profiles"]["Row"][],
            };
          })
          .filter(Boolean) as Club[] || [];

        setClubs(clubsWithDetails);
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
    <div className="flex flex-col -mx-4">
      {clubs.map((club) => (
        <div key={club.id} className="border-b last:border-b-0">
          <ClubCard club={club} />
        </div>
      ))}
    </div>
  );
}