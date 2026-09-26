"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getProfileTimeline,
  ProfileTimelineItem,
} from "@/lib/queries/profile-timeline-queries";

export interface FetchProfileTimelineResult {
  items: ProfileTimelineItem[];
  hasMore: boolean;
}

export async function fetchProfileTimelineAction(
  userId: string,
  limit: number
): Promise<FetchProfileTimelineResult> {
  const supabase = await createClient();
  return getProfileTimeline(supabase, userId, limit);
}
