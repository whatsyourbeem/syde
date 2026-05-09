import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { unstable_cache } from "next/cache";

type MeetupRow = Database["public"]["Tables"]["meetups"]["Row"];

export interface MeetupsListResult {
  meetups: any[];
  count: number;
}

export interface MeetupsListOptions {
  currentPage: number;
  limit: number;
  searchQuery?: string;
}

/**
 * Fetch meetups list with search query and pagination
 */
export async function getMeetupsList(
  supabase: SupabaseClient<Database>,
  { currentPage, limit, searchQuery }: MeetupsListOptions
): Promise<MeetupsListResult> {
  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('meetups')
    .select(`
      *,
      organizer_profile:profiles!organizer_id(*),
      clubs:clubs(*)
    `, { count: 'exact' });

  if (searchQuery) {
    const escaped = searchQuery.replace(/"/g, '\\"');
    query = query.or(`title.ilike."%${escaped}%",location.ilike."%${escaped}%",address.ilike."%${escaped}%"`);
  }

  const { data, error, count } = await query
    .order('start_datetime', { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    meetups: data || [],
    count: count || 0,
  };
}

/**
 * Fetch joined meetups for a user
 */
export async function getUserJoinedMeetups(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<MeetupRow[]> {
  const { data, error } = await supabase
    .from("meetup_participants")
    .select(`
      meetup_id,
      meetups (*)
    `)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  // Extract and filter valid meetups
  const meetups = (data
    ?.map((item: any) => item.meetups)
    .filter(Boolean) as MeetupRow[])
    .sort((a, b) => {
      const dateA = a.start_datetime ? new Date(a.start_datetime).getTime() : 0;
      const dateB = b.start_datetime ? new Date(b.start_datetime).getTime() : 0;
      return dateB - dateA; // Newest first
    });

  return meetups;
}

/**
 * Fetch a single meetup detail by ID
 */
export async function getMeetupDetail(
  supabase: SupabaseClient<Database>,
  meetupId: string
) {
  const { data, error } = await supabase
    .from("meetups")
    .select(
      "*, clubs(*), organizer_profile:profiles!meetups_organizer_id_fkey(full_name, username, avatar_url, certified), meetup_participants(*, profiles(id, full_name, username, avatar_url, tagline, certified)), status, start_datetime, end_datetime, location, address, max_participants, fee"
    )
    .eq("id", meetupId)
    .single();

  if (error) {
    console.error("Error fetching meetup detail:", error);
    return null;
  }
  return data;
}

/**
 * Cached version of getMeetupDetail
 */
export const getMeetupDetailCached = (
  supabase: SupabaseClient<Database>,
  meetupId: string
) => {
  return unstable_cache(
    async () => {
      return getMeetupDetail(supabase, meetupId);
    },
    ["meetup-detail", meetupId],
    {
      revalidate: 3600,
      tags: ["meetup-all", `meetup-${meetupId}`],
    }
  )();
};

/**
 * Cached version of getMeetupsList
 */
export const getMeetupsListCached = (
  supabase: SupabaseClient<Database>,
  options: MeetupsListOptions
) => {
  const { currentPage, limit, searchQuery = "" } = options;
  return unstable_cache(
    async () => {
      return getMeetupsList(supabase, options);
    },
    ["meetups-list", currentPage.toString(), limit.toString(), searchQuery],
    {
      revalidate: 3600,
      tags: ["meetup-all", `meetup-list-p${currentPage}-l${limit}`],
    }
  )();
};
