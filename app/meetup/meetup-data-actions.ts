"use server";

import { createClient } from "@/lib/supabase/server";
import { Enums } from "@/types/database.types";
import { MEETUP_STATUS_DISPLAY_NAMES } from "@/lib/constants";

const MEETUPS_PER_PAGE = 12;

interface MeetupQueryOptions {
  /** 이전 페이지 마지막 모임의 created_at. 없으면 첫 페이지. */
  cursor?: string | null;
  meetupsPerPage?: number;
  status?: string;
}

export async function fetchMeetupsAction({
  cursor,
  meetupsPerPage = MEETUPS_PER_PAGE,
  status,
}: MeetupQueryOptions) {
  const supabase = await createClient();

  let query = supabase
    .from("meetups")
    .select(
      "*, clubs(id, name, thumbnail_url, created_at, description, owner_id, tagline, updated_at), organizer_profile:profiles!meetups_organizer_id_fkey(id, full_name, username, avatar_url, tagline, certified, bio, link, updated_at), thumbnail_url, status, start_datetime, end_datetime, location, address, max_participants"
    )
    .order("created_at", { ascending: false })
    // 한 건 더 가져와 다음 페이지가 있는지 판단한다.
    .limit(meetupsPerPage + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  if (status && status !== "전체") {
    const meetupStatus = Object.entries(MEETUP_STATUS_DISPLAY_NAMES).find(
      (entry) => entry[1] === status
    )?.[0] as Enums<"meetup_status_enum"> | undefined;

    if (meetupStatus) {
      query = query.eq("status", meetupStatus);
    }
  }

  const { data: fetched, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const hasMore = (fetched?.length ?? 0) > meetupsPerPage;
  const meetups = (fetched || []).slice(0, meetupsPerPage);

  return {
    meetups,
    nextCursor: hasMore ? meetups[meetups.length - 1]?.created_at ?? null : null,
  };
}
