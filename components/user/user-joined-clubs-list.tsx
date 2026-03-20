"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import Link from "next/link";
import Image from "next/image";
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
      user_id: string;
      profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
    }[];
  }) | null;
};

interface UserJoinedClubsListProps {
  userId: string;
  variant?: "default" | "compact";
}

export function UserJoinedClubsList({ 
  userId, 
  variant = "default" 
}: UserJoinedClubsListProps) {
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
              members: clubData.club_members
                .map((m: { profiles: Database["public"]["Tables"]["profiles"]["Row"] | null }) => m.profiles)
                .filter(Boolean) as Database["public"]["Tables"]["profiles"]["Row"][],
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
    if (variant === "compact") {
      return (
        <div className="flex items-center justify-center h-[81px] text-center px-4">
          <p className="text-[#777777] text-sm font-light leading-[150%]">
            아직 어떤 클럽에도 속하지 않았어요.<br />
            아직은 조용하지만, 새로운 연결이 기다리고 있어요.
          </p>
        </div>
      );
    }
    return (
      <div className="text-center text-muted-foreground py-8">
        가입한 클럽이 없습니다.
      </div>
    );
  }

  if (variant === "compact") {
    const displayClubs = clubs.slice(0, 3);
    const hasMore = clubs.length > 3;

    return (
      <div className="flex items-center gap-4 py-2 px-1">
        {displayClubs.map((club) => (
          <Link 
            key={club.id} 
            href={`/club/${club.id}`}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200">
              <Image
                src={club.thumbnail_url || "/default_club_thumbnail.png"}
                alt={club.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="text-[11px] font-semibold text-black text-center line-clamp-1 w-20">
              {club.name}
            </span>
          </Link>
        ))}
        {hasMore && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-xl bg-[#F1F1F1] flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="flex gap-0.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-[#434343]" />
                ))}
              </div>
            </div>
            <span className="text-[11px] font-medium text-black">더보기</span>
          </div>
        )}
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