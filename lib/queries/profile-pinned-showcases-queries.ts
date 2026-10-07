import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { fetchShowcasesAction } from "@/app/showcase/showcase-data-actions";
import { OptimizedShowcase } from "@/lib/queries/showcase-queries";

const FALLBACK_STATUSES: Database["public"]["Enums"]["showcase_status_enum"][] = [
  "DEVELOPING",
  "IN_SERVICE",
];

/**
 * 대표 프로젝트로 고정된 쇼케이스 ID를 순서대로 가져온다. 없으면 빈 배열.
 */
export async function getPinnedShowcaseIds(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("profile_pinned_showcases")
    .select("showcase_id")
    .eq("user_id", userId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching pinned showcases:", error);
    return [];
  }
  return (data || []).map((row) => row.showcase_id);
}

/**
 * 대표 프로젝트 카드에 노출할 쇼케이스를 가져온다.
 * 핀이 있으면 핀 순서대로, 없으면 진행중/런칭 최신 3개를 기본값으로 보여준다.
 */
export async function getFeaturedShowcases(
  supabase: SupabaseClient<Database>,
  userId: string,
  currentUserId: string | null
): Promise<OptimizedShowcase[]> {
  const pinnedIds = await getPinnedShowcaseIds(supabase, userId);

  if (pinnedIds.length > 0) {
    const result = await fetchShowcasesAction({
      currentUserId,
      showcasesPerPage: pinnedIds.length,
      filterByShowcaseIds: pinnedIds,
    });
    return result.showcases;
  }

  // 직접 만든 쇼케이스 + 팀원으로 참여한 쇼케이스를 함께 후보로 삼는다.
  const { data: memberRows, error: memberError } = await supabase
    .from("showcases_members")
    .select("showcase_id")
    .eq("user_id", userId);

  if (memberError) {
    console.error("Error fetching member showcases:", memberError);
  }

  const memberIds = (memberRows || []).map((row) => row.showcase_id);
  const ownedFilter = `user_id.eq.${userId}`;
  const { data, error } = await supabase
    .from("showcases")
    .select("id")
    .or(memberIds.length > 0 ? `${ownedFilter},id.in.(${memberIds.join(",")})` : ownedFilter)
    .in("status", FALLBACK_STATUSES)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error || !data || data.length === 0) {
    return [];
  }

  const result = await fetchShowcasesAction({
    currentUserId,
    showcasesPerPage: data.length,
    filterByShowcaseIds: data.map((row) => row.id),
  });
  return result.showcases;
}
