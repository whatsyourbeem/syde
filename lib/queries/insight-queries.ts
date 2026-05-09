import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

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
