import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";

type ShowcaseRow = Database["public"]["Tables"]["showcases"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface OptimizedShowcase extends ShowcaseRow {
  profiles: ProfileRow | null;
  showcase_likes: Array<{ user_id: string }>;
  showcase_bookmarks: Array<{ user_id: string }>;
  showcase_comments: Array<{ id: string }>;
  likesCount: number;
  hasLiked: boolean;
  bookmarksCount: number;
  hasBookmarked: boolean;
}

export interface ShowcaseQueryOptions {
  currentUserId: string | null;
  currentPage: number;
  showcasesPerPage: number;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  filterByBookmarkedUserId?: string;
  searchQuery?: string;
}

export interface ShowcaseQueryResult {
  showcases: OptimizedShowcase[];
  count: number;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
}

/**
 * Optimized query for CLIENT-side fetching, mirroring the log-queries structure.
 */
export async function getOptimizedShowcases({
  currentUserId,
  currentPage,
  showcasesPerPage,
  filterByUserId,
  filterByCommentedUserId,
  filterByLikedUserId,
  filterByBookmarkedUserId,
  searchQuery,
}: ShowcaseQueryOptions): Promise<ShowcaseQueryResult> {
  const supabase = createClient();
  const from = (currentPage - 1) * showcasesPerPage;
  const to = from + showcasesPerPage - 1;

  // 1. Fetch liked showcase IDs for the current user in a separate query.
  let likedShowcaseIdsSet = new Set<string>();
  if (currentUserId) {
    const { data: likedShowcases } = await supabase
      .from('showcase_likes')
      .select('showcase_id')
      .eq('user_id', currentUserId);

    if (likedShowcases) {
      likedShowcaseIdsSet = new Set(likedShowcases.map(like => like.showcase_id).filter((id): id is string => id !== null));
    }
  }

  // 2. Build the main query.
  const selectQuery = `
    id,
    content,
    image_url,
    created_at,
    updated_at,
    user_id,
    profiles:user_id (id, username, full_name, avatar_url, updated_at, tagline, bio, link, certified),
    showcase_bookmarks(user_id),
    showcase_comments(id),
    likes_count:showcase_likes(count)
  `;

  let query = supabase.from("showcases").select(selectQuery, { count: "exact" });

  // Handle search query optimization
  if (searchQuery) {
    const searchConditions = await buildOptimizedSearchConditions(searchQuery);
    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(","));
    } else {
      return { showcases: [], count: 0, mentionedProfiles: [] };
    }
  }

  // Apply filters
  if (filterByUserId) {
    query = query.eq("user_id", filterByUserId);
  } else if (filterByCommentedUserId) {
    const commentedShowcaseIds = await getCommentedShowcaseIds(filterByCommentedUserId);
    if (commentedShowcaseIds.length === 0) return { showcases: [], count: 0, mentionedProfiles: [] };
    query = query.in("id", commentedShowcaseIds);
  } else if (filterByLikedUserId) {
    const likedShowcaseIds = await getLikedShowcaseIds(filterByLikedUserId);
    if (likedShowcaseIds.length === 0) return { showcases: [], count: 0, mentionedProfiles: [] };
    query = query.in("id", likedShowcaseIds);
  } else if (filterByBookmarkedUserId) {
    const bookmarkedShowcaseIds = await getBookmarkedShowcaseIds(filterByBookmarkedUserId);
    if (bookmarkedShowcaseIds.length === 0) return { showcases: [], count: 0, mentionedProfiles: [] };
    query = query.in("id", bookmarkedShowcaseIds);
  }

  // Execute the main query
  const { data: showcasesData, error: showcasesError, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (showcasesError) {
    throw showcasesError;
  }

  // Batch fetch mentioned profiles
  const mentionedProfiles = await getMentionedProfiles(showcasesData || []);

  // 3. Process showcases and determine 'hasLiked' using the Set.
  const processedShowcases: OptimizedShowcase[] = (showcasesData || []).map((showcase) => ({
    ...showcase,
    profiles: Array.isArray(showcase.profiles) ? showcase.profiles[0] : showcase.profiles,
    likesCount: showcase.likes_count?.[0]?.count || 0,
    hasLiked: likedShowcaseIdsSet.has(showcase.id),
    bookmarksCount: showcase.showcase_bookmarks?.length || 0,
    hasBookmarked: currentUserId
      ? showcase.showcase_bookmarks?.some((bookmark) => bookmark.user_id === currentUserId)
      : false,
    showcase_likes: [], // Keep interface consistent
    showcase_comments: showcase.showcase_comments || [],
  }));

  return {
    showcases: processedShowcases,
    count: count || 0,
    mentionedProfiles,
  };
}

async function buildOptimizedSearchConditions(searchQuery: string): Promise<string[]> {
  const supabase = createClient();
  const { data: matchingProfiles } = await supabase
    .from("profiles")
    .select("id")
    .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);

  const conditions: string[] = [`content.ilike.%${searchQuery}%`];

  if (matchingProfiles && matchingProfiles.length > 0) {
    const mentionConditions = matchingProfiles.map(
      (profile) => `content.ilike.%[mention:${profile.id}]%`
    );
    conditions.push(...mentionConditions);
  }

  return conditions;
}

async function getCommentedShowcaseIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("showcase_comments")
    .select("showcase_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map(item => item.showcase_id).filter((id): id is string => id !== null);
}

async function getLikedShowcaseIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("showcase_likes")
    .select("showcase_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map(item => item.showcase_id).filter((id): id is string => id !== null);
}

async function getBookmarkedShowcaseIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("showcase_bookmarks")
    .select("showcase_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map(item => item.showcase_id).filter((id): id is string => id !== null);
}

async function getMentionedProfiles(showcases: Array<{ content: string }>): Promise<Array<{ id: string; username: string | null }>> {
  const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
  const mentionedUserIds = new Set<string>();
  
  showcases.forEach((showcase) => {
    const matches = showcase.content.matchAll(mentionRegex);
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
