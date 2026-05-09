import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type ClubWithDetails = ClubRow & {
  owner_profile: ProfileRow | null;
  member_count: number;
  members: ProfileRow[];
};

export type FetchedClubMember = {
  clubs: (ClubRow & {
    owner_profile: ProfileRow | null;
    member_count: { count: number }[];
    club_members: {
      user_id: string;
      profiles: ProfileRow | null;
    }[];
  }) | null;
};

/**
 * Fetch joined clubs for a user with owner profile and member details
 */
export async function getUserJoinedClubs(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ClubWithDetails[]> {
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
    throw error;
  }

  const clubsWithDetails = (data || [])
    .map((item) => {
      if (!item.clubs) return null;
      const clubData = item.clubs;
      return {
        ...clubData,
        owner_profile: clubData.owner_profile,
        member_count: Array.isArray(clubData.member_count)
          ? clubData.member_count[0]?.count || 0
          : 0,
        members: clubData.club_members
          .map((m: any) => m.profiles)
          .filter(Boolean) as ProfileRow[],
      };
    })
    .filter(Boolean) as ClubWithDetails[];

  return clubsWithDetails;
}
