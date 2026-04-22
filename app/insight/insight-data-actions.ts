"use server";

import { createClient } from "@/lib/supabase/server";
import { InsightCardProps } from "@/components/insight/insight-card";

export interface InsightQueryOptions {
  currentPage: number;
  itemsPerPage: number;
  currentUserId?: string | null;
}

export interface InsightQueryResult {
  insights: InsightCardProps[];
  count: number;
  hasMore: boolean;
  currentPage: number;
}

export async function fetchInsightsAction({
  currentPage,
  itemsPerPage,
  currentUserId,
}: InsightQueryOptions): Promise<InsightQueryResult> {
  const supabase = await createClient();
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  const { data, error, count } = await supabase
    .from("insights")
    .select(`
        id,
        slug,
        user_id,
        title,
        summary,
        image_url,
        created_at,
        profiles:user_id (
            username,
            full_name,
            avatar_url,
            tagline
        ),
        insight_comments (id),
        insight_likes (id, user_id),
        insight_bookmarks (insight_id, user_id)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching insights:", error);
    throw new Error(error.message);
  }

  const mappedData: InsightCardProps[] = (data || []).map((item: any) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    createdAt: item.created_at,
    imageUrl: item.image_url,
    author: {
      id: item.user_id,
      name: item.profiles?.full_name || item.profiles?.username || "알 수 없는 사용자",
      role: item.profiles?.tagline || "멤버",
      avatarUrl: item.profiles?.avatar_url
    },
    stats: {
      likes: item.insight_likes?.length || 0,
      comments: item.insight_comments?.length || 0,
      bookmarks: item.insight_bookmarks?.length || 0
    },
    initialStatus: {
      hasLiked: currentUserId ? item.insight_likes?.some((l: any) => l.user_id === currentUserId) : false,
      hasBookmarked: currentUserId ? item.insight_bookmarks?.some((b: any) => b.user_id === currentUserId) : false
    },
    currentUserId: currentUserId || null
  }));

  return {
    insights: mappedData,
    count: count || 0,
    hasMore: data?.length === itemsPerPage,
    currentPage
  };
}
