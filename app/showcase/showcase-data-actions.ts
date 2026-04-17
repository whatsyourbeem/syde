"use server";

import { createClient } from "@/lib/supabase/server";
import { OptimizedShowcase, ShowcaseQueryOptions, ShowcaseQueryResult } from "@/lib/queries/showcase-queries";
import { Database } from "@/types/database.types";

/**
 * Server Action for fetching optimized showcases.
 * Replaces the client-side getOptimizedShowcases to avoid waterfall requests.
 */
export async function fetchShowcasesAction({
  currentUserId,
  currentPage,
  showcasesPerPage,
  filterByUserId,
  filterByParticipantUserId,
  filterByCommentedUserId,
  filterByUpvotedUserId,
  searchQuery,
}: ShowcaseQueryOptions): Promise<ShowcaseQueryResult> {
  const supabase = await createClient(); // Use server client
  const from = (currentPage - 1) * showcasesPerPage;
  const to = from + showcasesPerPage - 1;

  // 1. Fetch upvoted showcase IDs for the current user in a separate query.
  // Note: On server side, we can parallelize these requests better or just await them.
  let upvotedShowcaseIdsSet = new Set<string>();
  if (currentUserId) {
    const { data: upvotedShowcases } = await supabase
      .from('showcase_upvotes')
      .select('showcase_id')
      .eq('user_id', currentUserId);

    if (upvotedShowcases) {
      upvotedShowcaseIdsSet = new Set(upvotedShowcases.map(upvote => upvote.showcase_id).filter((id): id is string => id !== null));
    }
  }

  // 2. Build the main query.
  const selectQuery = `
    id,
    name,
    slug,
    short_description,
    description,
    thumbnail_url,
    created_at,
    updated_at,
    user_id,
    views_count,
    showcase_awards(date, type),
    profiles:user_id (id, username, full_name, avatar_url, updated_at, tagline, bio, link, certified),
    showcase_comments(id),
    upvotes_count:showcase_upvotes(count),
    members:showcases_members(
      id,
      user_id,
      display_order,
      profile:profiles!showcases_members_user_id_fkey(id, username, full_name, avatar_url, tagline)
    )
  `;

  let query = supabase.from("showcases").select(selectQuery, { count: "exact" });

  // Handle search query optimization
  if (searchQuery) {
    // We need to implement buildOptimizedSearchConditions logic here using logic suitable for server
    const searchConditions = await buildOptimizedSearchConditions(supabase, searchQuery);
    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(","));
    } else {
      return { showcases: [], count: 0, mentionedProfiles: [], currentPage };
    }
  }

  // Apply filters
  if (filterByUserId) {
    query = query.eq("user_id", filterByUserId);
  } else if (filterByParticipantUserId) {
    const memberShowcaseIds = await getMemberShowcaseIds(supabase, filterByParticipantUserId);
    // Combine author-owned showcases and member-participated showcases
    if (memberShowcaseIds.length > 0) {
      query = query.or(`user_id.eq.${filterByParticipantUserId},id.in.(${memberShowcaseIds.join(',')})`);
    } else {
      query = query.eq("user_id", filterByParticipantUserId);
    }
  } else if (filterByCommentedUserId) {
    const commentedShowcaseIds = await getCommentedShowcaseIds(supabase, filterByCommentedUserId);
    if (commentedShowcaseIds.length === 0) return { showcases: [], count: 0, mentionedProfiles: [], currentPage };
    query = query.in("id", commentedShowcaseIds);
  } else if (filterByUpvotedUserId) {
    const upvotedShowcaseIds = await getUpvotedShowcaseIds(supabase, filterByUpvotedUserId);
    if (upvotedShowcaseIds.length === 0) return { showcases: [], count: 0, mentionedProfiles: [], currentPage };
    query = query.in("id", upvotedShowcaseIds);
  }

  // Execute the main query
  const { data: showcasesData, error: showcasesError, count } = await (query as any)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (showcasesError) {
    console.error("Error fetching showcases:", showcasesError);
    throw new Error(showcasesError.message);
  }

  // Batch fetch mentioned profiles
  // We can reuse the logic, but need to pass the supabase client or reimplement
  const mentionedProfiles = await getMentionedProfiles(supabase, showcasesData || []);

  // 3. Process showcases and determine 'hasUpvoted' using the Set.
  const processedShowcases: OptimizedShowcase[] = (showcasesData || []).map((showcase: any) => ({
    ...showcase,
    profiles: Array.isArray(showcase.profiles) ? showcase.profiles[0] : showcase.profiles,
    upvotesCount: showcase.upvotes_count?.[0]?.count || 0,
    hasUpvoted: upvotedShowcaseIdsSet.has(showcase.id),
    views_count: showcase.views_count || 0,
    showcase_upvotes: [], // Keep interface consistent
    showcase_comments: showcase.showcase_comments || [],
    members: (showcase.members || []).map((m: any) => ({
      ...m,
      profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
    })).sort((a: any, b: any) => a.display_order - b.display_order),
    showcase_awards: showcase.showcase_awards || [],
  }));

  return {
    showcases: processedShowcases,
    count: count || 0,
    mentionedProfiles,
    currentPage,
  };
}

/**
 * Fetches the most recently awarded SYDE Pick showcase.
 */
export async function fetchLatestAwardedShowcase(currentUserId?: string | null): Promise<OptimizedShowcase | null> {
  const supabase = await createClient();

  // 1. Calculate the date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().split('T')[0];

  // 2. Get the latest award entry for SYDE_PICK within the last 30 days
  const { data: awardData, error: awardError } = await supabase
    .from('showcase_awards')
    .select('showcase_id, date, type')
    .eq('type', 'SYDE_PICK')
    .gte('date', thirtyDaysAgoIso)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (awardError || !awardData) {
    return null;
  }

  const showcaseId = awardData.showcase_id;

  // 2. Fetch the full optimized showcase data for this ID
  const selectQuery = `
    id,
    name,
    slug,
    short_description,
    description,
    thumbnail_url,
    created_at,
    updated_at,
    user_id,
    views_count,
    showcase_awards(date, type),
    profiles:user_id (id, username, full_name, avatar_url, updated_at, tagline, bio, link, certified),
    showcase_comments(id),
    upvotes_count:showcase_upvotes(count),
    members:showcases_members(
      id,
      user_id,
      display_order,
      profile:profiles!showcases_members_user_id_fkey(id, username, full_name, avatar_url, tagline)
    )
  `;

  const { data: showcase, error: showcaseError } = await supabase
    .from("showcases")
    .select(selectQuery)
    .eq("id", showcaseId)
    .single();

  if (showcaseError || !showcase) {
    return null;
  }

  // 3. Check if current user has upvoted
  let hasUpvoted = false;
  if (currentUserId) {
    const { data: upvote } = await supabase
      .from('showcase_upvotes')
      .select('id')
      .eq('showcase_id', showcaseId)
      .eq('user_id', currentUserId)
      .maybeSingle();
    hasUpvoted = !!upvote;
  }

  // 4. Transform to OptimizedShowcase format
  const processed: OptimizedShowcase = {
    ...showcase,
    profiles: Array.isArray(showcase.profiles) ? showcase.profiles[0] : showcase.profiles,
    upvotesCount: showcase.upvotes_count?.[0]?.count || 0,
    hasUpvoted,
    views_count: showcase.views_count || 0,
    showcase_upvotes: [],
    showcase_comments: showcase.showcase_comments || [],
    members: (showcase.members || []).map((m: any) => ({
      ...m,
      profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
    })).sort((a: any, b: any) => a.display_order - b.display_order),
    showcase_awards: showcase.showcase_awards || [],
  } as any;

  return processed;
}

// Helper functions adapted for Server Action usage (passing Supabase client)

async function buildOptimizedSearchConditions(supabase: any, searchQuery: string): Promise<string[]> {
  const { data: matchingProfiles } = await supabase
    .from("profiles")
    .select("id")
    .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);

  const conditions: string[] = [
    `name.ilike.%${searchQuery}%`,
    `short_description.ilike.%${searchQuery}%`
  ];

  if (matchingProfiles && matchingProfiles.length > 0) {
    const mentionConditions = matchingProfiles.map(
      (profile: { id: string }) => `description.ilike.%[mention:${profile.id}]%`
    );
    conditions.push(...mentionConditions);
  }

  return conditions;
}

async function getCommentedShowcaseIds(supabase: any, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("showcase_comments")
    .select("showcase_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map((item: { showcase_id: string }) => item.showcase_id).filter((id: string | null): id is string => id !== null);
}

async function getUpvotedShowcaseIds(supabase: any, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("showcase_upvotes")
    .select("showcase_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map((item: { showcase_id: string }) => item.showcase_id).filter((id: string | null): id is string => id !== null);
}

async function getMemberShowcaseIds(supabase: any, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("showcases_members")
    .select("showcase_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map((item: { showcase_id: string }) => item.showcase_id).filter((id: string | null): id is string => id !== null);
}

async function getMentionedProfiles(supabase: any, showcases: any[]): Promise<Array<{ id: string; username: string | null }>> {
  const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
  const mentionedUserIds = new Set<string>();
  
  showcases.forEach((showcase) => {
    // Check both descriptions for mentions
    const textToSearch = `${showcase.short_description || ''} ${showcase.description || ''}`;
    const matches = textToSearch.matchAll(mentionRegex);
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
