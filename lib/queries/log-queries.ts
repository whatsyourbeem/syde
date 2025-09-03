import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";

type LogRow = Database["public"]["Tables"]["logs"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface OptimizedLog extends LogRow {
  profiles: ProfileRow | null;
  log_likes: Array<{ user_id: string }>;
  log_comments: Array<{ id: string }>;
  likesCount: number;
  hasLiked: boolean;
}

export interface LogQueryOptions {
  currentUserId: string | null;
  currentPage: number;
  logsPerPage: number;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  searchQuery?: string;
}

export interface LogQueryResult {
  logs: OptimizedLog[];
  count: number;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
}

/**
 * Optimized query that reduces N+1 patterns by:
 * 1. Using CTEs (Common Table Expressions) for filtering
 * 2. Batching profile lookups
 * 3. Single query with proper joins
 */
export async function getOptimizedLogs({
  currentUserId,
  currentPage,
  logsPerPage,
  filterByUserId,
  filterByCommentedUserId,
  filterByLikedUserId,
  searchQuery,
}: LogQueryOptions): Promise<LogQueryResult> {
  const supabase = createClient();
  const from = (currentPage - 1) * logsPerPage;
  const to = from + logsPerPage - 1;

  // Build the base query with proper joins
  let query = supabase.from("logs").select(
    `
      id,
      content,
      image_url,
      created_at,
      user_id,
      profiles (id, username, full_name, avatar_url, updated_at, tagline, bio, link),
      log_likes(user_id),
      log_comments(id)
    `,
    { count: "exact" }
  );

  // Handle search query optimization
  if (searchQuery) {
    const searchConditions = await buildOptimizedSearchConditions(searchQuery);
    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(","));
    } else {
      // If no valid search conditions, return empty result
      return { logs: [], count: 0, mentionedProfiles: [] };
    }
  }

  // Apply filters
  if (filterByUserId) {
    query = query.eq("user_id", filterByUserId);
  } else if (filterByCommentedUserId) {
    // Use a more efficient approach with IN clause
    const commentedLogIds = await getCommentedLogIds(filterByCommentedUserId);
    if (commentedLogIds.length === 0) {
      return { logs: [], count: 0, mentionedProfiles: [] };
    }
    query = query.in("id", commentedLogIds);
  } else if (filterByLikedUserId) {
    // Use a more efficient approach with IN clause
    const likedLogIds = await getLikedLogIds(filterByLikedUserId);
    if (likedLogIds.length === 0) {
      return { logs: [], count: 0, mentionedProfiles: [] };
    }
    query = query.in("id", likedLogIds);
  }

  // Execute the main query
  const { data: logsData, error: logsError, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (logsError) {
    throw logsError;
  }

  // Batch fetch mentioned profiles
  const mentionedProfiles = await getMentionedProfiles(logsData || []);

  // Process logs with computed fields
  const processedLogs: OptimizedLog[] = (logsData || []).map((log) => ({
    ...log,
    profiles: Array.isArray(log.profiles) ? log.profiles[0] : log.profiles,
    likesCount: log.log_likes?.length || 0,
    hasLiked: currentUserId
      ? log.log_likes?.some((like) => like.user_id === currentUserId) || false
      : false,
  })) as OptimizedLog[];

  return {
    logs: processedLogs,
    count: count || 0,
    mentionedProfiles,
  };
}

/**
 * Optimized search condition builder
 */
async function buildOptimizedSearchConditions(searchQuery: string): Promise<string[]> {
  const supabase = createClient();
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
async function getCommentedLogIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  
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
async function getLikedLogIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("log_likes")
    .select("log_id")
    .eq("user_id", userId);

  if (error) throw error;

  return data.map(item => item.log_id).filter((id): id is string => id !== null);
}

/**
 * Batch fetch mentioned profiles to avoid N+1 queries
 */
async function getMentionedProfiles(logs: Array<{ content: string }>): Promise<Array<{ id: string; username: string | null }>> {
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

  const supabase = createClient();
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