import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { PublicProfile } from "@/types/profile";
import { unstable_cache } from "next/cache";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];
type ProfileRow = PublicProfile;

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
        owner_profile:profiles!clubs_owner_id_fkey(id, username, full_name, avatar_url, tagline, certified, bio, link, updated_at),
        member_count:club_members(count),
        club_members(user_id, profiles(id, username, full_name, avatar_url, tagline, certified, bio, link, updated_at))
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

/**
 * Fetch a single club detail by ID
 */
export async function getClubDetail(
  supabase: SupabaseClient<Database>,
  clubId: string
) {
  const { data, error } = await supabase
    .from("clubs")
    .select(`
      *,
      owner_profile:profiles!clubs_owner_id_fkey(id, username, full_name, avatar_url, tagline, certified, bio, link, updated_at)
    `)
    .eq("id", clubId)
    .single();

  if (error) {
    console.error("Error fetching club detail:", error);
    return null;
  }
  return data;
}

/**
 * Cached version of getClubDetail
 */
export const getClubDetailCached = (
  supabase: SupabaseClient<Database>,
  clubId: string
) => {
  return unstable_cache(
    async () => {
      return getClubDetail(supabase, clubId);
    },
    ["club-detail", clubId],
    {
      revalidate: 3600,
      tags: ["club-all", `club-${clubId}`],
    }
  )();
};

/**
 * Fetch club forums by club ID
 */
export async function getClubForums(
  supabase: SupabaseClient<Database>,
  clubId: string
) {
  const { data, error } = await supabase
    .from("club_forums")
    .select(`
      id,
      name,
      description,
      club_id,
      read_permission,
      write_permission,
      position
    `)
    .eq("club_id", clubId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching club forums:", error);
    return [];
  }
  return data || [];
}

/**
 * Cached version of getClubForums
 */
export const getClubForumsCached = (
  supabase: SupabaseClient<Database>,
  clubId: string
) => {
  return unstable_cache(
    async () => {
      return getClubForums(supabase, clubId);
    },
    ["club-forums", clubId],
    {
      revalidate: 3600,
      tags: ["club-all", `club-forums-${clubId}`],
    }
  )();
}
