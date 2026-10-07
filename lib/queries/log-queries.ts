import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { PublicProfile } from "@/types/profile";

type LogRow = Database["public"]["Tables"]["logs"]["Row"];
type ProfileRow = PublicProfile;

export interface OptimizedLog extends LogRow {
  profiles: ProfileRow | null;
  log_likes: Array<{ user_id: string }>;
  log_bookmarks: Array<{ user_id: string }>;
  log_comments: Array<{ id: string }>;
  likesCount: number;
  hasLiked: boolean;
  bookmarksCount: number;
  hasBookmarked: boolean;
}

export interface LogQueryOptions {
  currentUserId: string | null;
  /** 이전 페이지의 마지막 항목 created_at. 없으면 첫 페이지. */
  cursor?: string | null;
  logsPerPage: number;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  filterByBookmarkedUserId?: string;
  searchQuery?: string;
}

export interface LogQueryResult {
  logs: OptimizedLog[];
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  /** 다음 페이지를 불러올 때 쓸 커서. 더 없으면 null. */
  nextCursor: string | null;
}

/**
 * Optimized query for CLIENT-side fetching.
 */
export async function getOptimizedLogs(
  supabase: SupabaseClient<Database>,
  {
    currentUserId,
    cursor,
    logsPerPage,
    filterByUserId,
    filterByCommentedUserId,
    filterByLikedUserId,
    filterByBookmarkedUserId,
    searchQuery,
  }: LogQueryOptions
): Promise<LogQueryResult> {
  // 1. Fetch liked log IDs for the current user in a separate query.
  let likedLogIdsSet = new Set<string>();
  if (currentUserId) {
    const { data: likedLogs } = await supabase
      .from('log_likes')
      .select('log_id')
      .eq('user_id', currentUserId);

    if (likedLogs) {
      likedLogIdsSet = new Set(likedLogs.map(like => like.log_id).filter((id): id is string => id !== null));
    }
  }

  // 2. Build the main query without the complex 'has_liked' subquery.
  const selectQuery = `
    id,
    content,
    image_url,
    created_at,
    updated_at,
    user_id,
    profiles:user_id (id, username, full_name, avatar_url, updated_at, tagline, bio, link, certified),
    log_bookmarks(user_id),
    log_comments(id),
    likes_count:log_likes(count)
  `;

  let query = supabase.from("logs").select(selectQuery);

  // Handle search query optimization
  if (searchQuery) {
    const searchConditions = await buildOptimizedSearchConditions(supabase, searchQuery);
    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(","));
    } else {
      return { logs: [], mentionedProfiles: [], nextCursor: null };
    }
  }

  // Apply filters
  if (filterByUserId) {
    query = query.eq("user_id", filterByUserId);
  } else if (filterByCommentedUserId) {
    const commentedLogIds = await getCommentedLogIds(supabase, filterByCommentedUserId);
    if (commentedLogIds.length === 0) return { logs: [], mentionedProfiles: [], nextCursor: null };
    query = query.in("id", commentedLogIds);
  } else if (filterByLikedUserId) {
    const likedLogIds = await getLikedLogIds(supabase, filterByLikedUserId);
    if (likedLogIds.length === 0) return { logs: [], mentionedProfiles: [], nextCursor: null };
    query = query.in("id", likedLogIds);
  } else if (filterByBookmarkedUserId) {
    const bookmarkedLogIds = await getBookmarkedLogIds(supabase, filterByBookmarkedUserId);
    if (bookmarkedLogIds.length === 0) return { logs: [], mentionedProfiles: [], nextCursor: null };
    query = query.in("id", bookmarkedLogIds);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  // 한 건 더 가져와 다음 페이지가 있는지 판단한다.
  const { data: fetched, error: logsError } = await query
    .order("created_at", { ascending: false })
    .limit(logsPerPage + 1);

  if (logsError) {
    throw logsError;
  }

  const hasMore = (fetched?.length ?? 0) > logsPerPage;
  const logsData = (fetched || []).slice(0, logsPerPage);

  // Batch fetch mentioned profiles
  const mentionedProfiles = await getMentionedProfiles(supabase, logsData || []);

  // 3. Process logs and determine 'hasLiked' using the Set.
  const processedLogs: OptimizedLog[] = (logsData || []).map((log) => ({
    ...log,
    profiles: Array.isArray(log.profiles) ? log.profiles[0] : log.profiles,
    likesCount: log.likes_count?.[0]?.count || 0,
    hasLiked: likedLogIdsSet.has(log.id),
    bookmarksCount: log.log_bookmarks?.length || 0,
    hasBookmarked: currentUserId
      ? log.log_bookmarks?.some((bookmark) => bookmark.user_id === currentUserId)
      : false,
    log_likes: [], // Keep interface consistent
    log_comments: log.log_comments || [],
  }));

  return {
    logs: processedLogs,
    mentionedProfiles,
    nextCursor: hasMore ? processedLogs[processedLogs.length - 1]?.created_at ?? null : null,
  };
}

/**
 * Optimized search condition builder
 */
async function buildOptimizedSearchConditions(supabase: SupabaseClient<Database>, searchQuery: string): Promise<string[]> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Batch profile lookup instead of separate query
  const { data: matchingProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);

  const conditions: string[] = [];

  if (matchingProfiles && matchingProfiles.length > 0) {
    // Add mention conditions for matching profiles
    const mentionConditions = matchingProfiles.map(
      (profile) => `content.ilike.%[mention:${profile.id}]%`
    );
    conditions.push(...mentionConditions);
  } else if (
    searchQuery.toLowerCase() === "mention" ||
    uuidRegex.test(searchQuery)
  ) {
    // Return empty conditions for mention-only or UUID searches with no matches
    return [];
  } else {
    // General text search
    conditions.push(`content.ilike.%${searchQuery}%`);
  }

  return conditions;
}

/**
 * Cached helper to get commented log IDs
 */
async function getCommentedLogIds(supabase: SupabaseClient<Database>, userId: string): Promise<string[]> {

  const { data, error } = await supabase
    .from("log_comments")
    .select("log_id")
    .eq("user_id", userId);

  if (error) throw error;

  return data.map(item => item.log_id).filter((id): id is string => id !== null);
}

/**
 * Cached helper to get liked log IDs
 */
async function getLikedLogIds(supabase: SupabaseClient<Database>, userId: string): Promise<string[]> {

  const { data, error } = await supabase
    .from("log_likes")
    .select("log_id")
    .eq("user_id", userId);

  if (error) throw error;

  return data.map(item => item.log_id).filter((id): id is string => id !== null);
}

/**
 * Cached helper to get bookmarked log IDs
 */
async function getBookmarkedLogIds(supabase: SupabaseClient<Database>, userId: string): Promise<string[]> {

  const { data, error } = await supabase
    .from("log_bookmarks")
    .select("log_id")
    .eq("user_id", userId);

  if (error) throw error;

  return data.map(item => item.log_id).filter((id): id is string => id !== null);
}

/**
 * Batch fetch mentioned profiles to avoid N+1 queries
 */
async function getMentionedProfiles(supabase: SupabaseClient<Database>, logs: Array<{ content: string }>): Promise<Array<{ id: string; username: string | null }>> {
  const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
  const mentionedUserIds = new Set<string>();

  logs.forEach((log) => {
    const matches = log.content.matchAll(mentionRegex);
    for (const match of matches) {
      mentionedUserIds.add(match[1]);
    }
  });

  if (mentionedUserIds.size === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", Array.from(mentionedUserIds));

  if (error) {
    console.error("Error fetching mentioned profiles:", error);
    return [];
  }

  return data || [];
}

/**
 * Add a like to a log
 */
export async function insertLogLike(
  supabase: SupabaseClient<Database>,
  logId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("log_likes")
    .insert({ log_id: logId, user_id: userId });

  if (error) throw error;
}

/**
 * Remove a like from a log
 */
export async function deleteLogLike(
  supabase: SupabaseClient<Database>,
  logId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("log_likes")
    .delete()
    .eq("log_id", logId)
    .eq("user_id", userId);

  if (error) throw error;
}
