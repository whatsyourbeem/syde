import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { unstable_cache } from "next/cache";

export interface ProfileStats {
  blogPostsCount: number;
  showcasesCount: number;
  totalUpvotes: number;
  totalViews: number;
  sydePickCount: number;
  meetupsAttendedCount: number;
}

const EMPTY_STATS: ProfileStats = {
  blogPostsCount: 0,
  showcasesCount: 0,
  totalUpvotes: 0,
  totalViews: 0,
  sydePickCount: 0,
  meetupsAttendedCount: 0,
};

export async function getProfileStats(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ProfileStats> {
  const { data, error } = await supabase
    .rpc("get_profile_stats", { p_user_id: userId })
    .single();

  if (error || !data) {
    console.error("Error fetching profile stats:", error);
    return EMPTY_STATS;
  }

  return {
    blogPostsCount: data.blog_posts_count ?? 0,
    showcasesCount: data.showcases_count ?? 0,
    totalUpvotes: data.total_upvotes ?? 0,
    totalViews: data.total_views ?? 0,
    sydePickCount: data.syde_pick_count ?? 0,
    meetupsAttendedCount: data.meetups_attended_count ?? 0,
  };
}

export const getProfileStatsCached = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ProfileStats> => {
  // 캐시 키의 버전은 ProfileStats 모양이 바뀔 때 올린다. 배포 전에 저장된 옛 형태의 캐시
  // (예: blogPostsCount 없음)가 재배포 후에도 남아 undefined로 노출되는 것을 막는다.
  const cached = unstable_cache(
    async () => getProfileStats(supabase, userId),
    ["profile-stats-v2", userId],
    {
      revalidate: 300,
      tags: ["profile-all", `profile-stats-${userId}`],
    }
  );
  return cached();
};
