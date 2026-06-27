import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { PublicProfile } from "@/types/profile";
import { unstable_cache } from "next/cache";

type ProfileRow = PublicProfile;

export interface ProfilesListResult {
  users: ProfileRow[];
  count: number;
}

export interface ProfilesListOptions {
  currentPage: number;
  limit: number;
  searchQuery?: string;
}

/**
 * Fetch profile by user ID (id)
 */
export async function getProfileById(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, tagline, bio, link, updated_at, certified")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile by ID:", error);
    return null;
  }
  return data;
}

/**
 * Fetch profile list with search query and pagination
 */
export async function getProfilesList(
  supabase: SupabaseClient<Database>,
  { currentPage, limit, searchQuery }: ProfilesListOptions
): Promise<ProfilesListResult> {
  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, tagline, bio, link, updated_at, certified", { count: "exact" });

  if (searchQuery) {
    const escaped = searchQuery.replace(/"/g, '\\"');
    query = query.or(
      `username.ilike."%${escaped}%",full_name.ilike."%${escaped}%",tagline.ilike."%${escaped}%"`
    );
  }

  const { data: usersData, error: usersError, count } = await query
    .order("username", { ascending: true })
    .range(from, to);

  if (usersError) {
    throw usersError;
  }

  return {
    users: (usersData || []) as ProfileRow[],
    count: count || 0,
  };
}

export async function getProfileByUsername(
  supabase: SupabaseClient<Database>,
  username: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, link, tagline, updated_at, certified")
    .eq("username", username)
    .single();

  if (error) {
    console.error("Error fetching profile by username:", error);
    return null;
  }
  return data;
}

export const getProfileByUsernameCached = async (
  supabase: SupabaseClient<Database>,
  username: string
): Promise<ProfileRow | null> => {
  const cached = unstable_cache(
    async () => getProfileByUsername(supabase, username),
    ["profile-detail", username],
    {
      revalidate: 3600,
      tags: ["profile-all", `profile-${username}`],
    }
  );
  const result = await cached();
  // null(프로필 없음)은 캐시 히트로 계속 서빙되지 않도록 재조회
  if (result === null) {
    return getProfileByUsername(supabase, username);
  }
  return result;
};

export const getProfileByIdCached = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ProfileRow | null> => {
  const cached = unstable_cache(
    async () => getProfileById(supabase, userId),
    ["profile-by-id", userId],
    {
      revalidate: 3600,
      tags: ["profile-all", `profile-id-${userId}`],
    }
  );
  const result = await cached();
  if (result === null) {
    return getProfileById(supabase, userId);
  }
  return result;
};

