"use server";

import { createClient } from "@/lib/supabase/server";
import { Enums } from "@/types/database.types";
import { MEETUP_STATUS_DISPLAY_NAMES } from "@/lib/constants";

const MEETUPS_PER_PAGE = 12;

interface MeetupQueryOptions {
  currentPage: number;
  meetupsPerPage?: number;
  status?: string;
}

export async function fetchMeetupsAction({
  currentPage,
  meetupsPerPage = MEETUPS_PER_PAGE,
  status,
}: MeetupQueryOptions) {
  const supabase = await createClient();
  const from = (currentPage - 1) * meetupsPerPage;
  const to = from + meetupsPerPage - 1;

  let query = supabase
    .from("meetups")
    .select(
      "*, clubs(id, name, thumbnail_url, created_at, description, owner_id, tagline, updated_at), organizer_profile:profiles!meetups_organizer_id_fkey(id, full_name, username, avatar_url, tagline, certified, bio, link, updated_at), thumbnail_url, status, start_datetime, end_datetime, location, address, max_participants",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "전체") {
    const meetupStatus = Object.entries(MEETUP_STATUS_DISPLAY_NAMES).find(
      (entry) => entry[1] === status
    )?.[0] as Enums<"meetup_status_enum"> | undefined;

    if (meetupStatus) {
      query = query.eq("status", meetupStatus);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    meetups: data || [],
    count: count || 0,
    hasMore: (data?.length || 0) === meetupsPerPage,
    currentPage,
  };
}
