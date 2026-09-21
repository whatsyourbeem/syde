"use server";

import { createClient } from "@/lib/supabase/server";
import { BlogCardProps } from "@/components/blog/blog-card";

export interface BlogPostQueryOptions {
  currentPage: number;
  itemsPerPage: number;
  currentUserId?: string | null;
}

export interface BlogPostQueryResult {
  blogPosts: BlogCardProps[];
  count: number;
  hasMore: boolean;
  currentPage: number;
}

export async function fetchBlogPostsAction({
  currentPage,
  itemsPerPage,
  currentUserId,
}: BlogPostQueryOptions): Promise<BlogPostQueryResult> {
  const supabase = await createClient();
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  const { data, error, count } = await supabase
    .from("blog_posts")
    .select(`
        id,
        slug,
        user_id,
        title,
        summary,
        image_url,
        created_at,
        views,
        profiles:user_id (
            username,
            full_name,
            avatar_url,
            tagline
        ),
        blog_post_comments (id),
        blog_post_likes (id, user_id),
        blog_post_bookmarks (blog_post_id, user_id)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching blog posts:", error);
    throw new Error(error.message);
  }

  const mappedData: BlogCardProps[] = (data || []).map((item: any) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    createdAt: item.created_at,
    imageUrl: item.image_url,
    author: {
      id: item.user_id,
      username: item.profiles?.username,
      name: item.profiles?.full_name || item.profiles?.username || "알 수 없는 사용자",
      role: item.profiles?.tagline || "멤버",
      avatarUrl: item.profiles?.avatar_url
    },
    stats: {
      likes: item.blog_post_likes?.length || 0,
      comments: item.blog_post_comments?.length || 0,
      bookmarks: item.blog_post_bookmarks?.length || 0,
      views: item.views || 0
    },
    initialStatus: {
      hasLiked: currentUserId ? item.blog_post_likes?.some((l: any) => l.user_id === currentUserId) : false,
      hasBookmarked: currentUserId ? item.blog_post_bookmarks?.some((b: any) => b.user_id === currentUserId) : false
    },
    currentUserId: currentUserId || null
  }));

  return {
    blogPosts: mappedData,
    count: count || 0,
    hasMore: data?.length === itemsPerPage,
    currentPage
  };
}
