import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { unstable_cache } from "next/cache";

/**
 * Delete an insight by ID
 */
export async function deleteInsight(
  supabase: SupabaseClient<Database>,
  insightId: string
): Promise<void> {
  const { error } = await supabase
    .from("insights")
    .delete()
    .eq("id", insightId);

  if (error) throw error;
}

/**
 * Remove a like from an insight
 */
export async function deleteInsightLike(
  supabase: SupabaseClient<Database>,
  insightId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("insight_likes")
    .delete()
    .eq("insight_id", insightId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Add a like to an insight
 */
export async function insertInsightLike(
  supabase: SupabaseClient<Database>,
  insightId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("insight_likes")
    .insert({ insight_id: insightId, user_id: userId });

  if (error) throw error;
}

/**
 * Remove a bookmark from an insight
 */
export async function deleteInsightBookmark(
  supabase: SupabaseClient<Database>,
  insightId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("insight_bookmarks")
    .delete()
    .eq("insight_id", insightId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Add a bookmark to an insight
 */
export async function insertInsightBookmark(
  supabase: SupabaseClient<Database>,
  insightId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("insight_bookmarks")
    .insert({ insight_id: insightId, user_id: userId });

  if (error) throw error;
}

export interface InsightsListOptions {
  currentPage: number;
  itemsPerPage: number;
  userId?: string;
  searchQuery?: string;
}

export interface InsightsListResult {
  insights: any[];
  count: number;
}

/**
 * Fetch insights list with optional user ID filter and search query
 */
export async function getInsightsList(
  supabase: SupabaseClient<Database>,
  { currentPage, itemsPerPage, userId, searchQuery }: InsightsListOptions
): Promise<InsightsListResult> {
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  let query = supabase
    .from("insights")
    .select(`
      *,
      author:profiles!user_id(*),
      insight_comments(id),
      insight_likes(id, user_id),
      insight_bookmarks(insight_id, user_id)
    `, { count: "exact" });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (searchQuery) {
    const escaped = searchQuery.replace(/"/g, '\\"');
    query = query.or(`title.ilike."%${escaped}%",summary.ilike."%${escaped}%"`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    insights: data || [],
    count: count || 0,
  };
}

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export async function getInsightDetail(
  supabase: SupabaseClient<Database>,
  idOrSlug: string
) {
  let query = supabase
    .from("insights")
    .select(`
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url,
          tagline
        )
      `);

  if (isUUID(idOrSlug)) {
    query = query.eq("id", idOrSlug);
  } else {
    query = query.eq("slug", idOrSlug);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function getInsightIdBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("insights")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

export const getInsightIdBySlugCached = (
  supabase: SupabaseClient<Database>,
  slug: string
) => {
  return unstable_cache(
    async () => {
      return getInsightIdBySlug(supabase, slug);
    },
    ["insight-id-by-slug", slug],
    {
      revalidate: 3600,
      tags: ["insight-all", `insight-slug-${slug}`],
    }
  )();
};

export const getInsightDetailCached = async (
  supabase: SupabaseClient<Database>,
  idOrSlug: string
) => {
  let actualId = idOrSlug;
  if (!isUUID(idOrSlug)) {
    const resolvedId = await getInsightIdBySlugCached(supabase, idOrSlug);
    if (!resolvedId) return null;
    actualId = resolvedId;
  }

  return unstable_cache(
    async () => {
      return getInsightDetail(supabase, actualId);
    },
    ["insight-detail-by-id", actualId],
    {
      revalidate: 3600,
      tags: ["insight-all", `insight-${actualId}`, `insight-${idOrSlug}`],
    }
  )();
};
