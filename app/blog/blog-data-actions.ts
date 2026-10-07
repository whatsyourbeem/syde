"use server";

import { createClient } from "@/lib/supabase/server";
import { BlogCardProps } from "@/components/blog/blog-card";

export interface BlogPostQueryOptions {
  /** 이전 페이지 마지막 글의 created_at. 없으면 첫 페이지. */
  cursor?: string | null;
  itemsPerPage: number;
  currentUserId?: string | null;
  /** 특정 작성자의 글만 필터링 (프로필 페이지 "전체보기" 등) */
  userId?: string;
}

export interface BlogPostQueryResult {
  blogPosts: BlogCardProps[];
  /** 다음 페이지를 불러올 때 쓸 커서. 더 없으면 null. */
  nextCursor: string | null;
}

export async function fetchBlogPostsAction({
  cursor,
  itemsPerPage,
  currentUserId,
  userId,
}: BlogPostQueryOptions): Promise<BlogPostQueryResult> {
  const supabase = await createClient();

  let query = supabase
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
            tagline,
            certified
        ),
        blog_post_comments (id),
        blog_post_likes (id, user_id),
        blog_post_bookmarks (blog_post_id, user_id)
    `);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  // 한 건 더 가져와 다음 페이지가 있는지 판단한다.
  const { data: fetched, error } = await query
    .order("created_at", { ascending: false })
    .limit(itemsPerPage + 1);

  if (error) {
    console.error("Error fetching blog posts:", error);
    throw new Error(error.message);
  }

  const hasMore = (fetched?.length ?? 0) > itemsPerPage;
  const data = (fetched || []).slice(0, itemsPerPage);

  const mappedData: BlogCardProps[] = data.map((item: any) => ({
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
      avatarUrl: item.profiles?.avatar_url,
      certified: item.profiles?.certified ?? false
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
    nextCursor: hasMore ? data[data.length - 1]?.created_at ?? null : null,
  };
}
