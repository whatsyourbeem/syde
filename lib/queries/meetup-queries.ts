import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

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
