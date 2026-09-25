import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { unstable_cache } from "next/cache";

/**
 * Remove a like from a blog post
 */
export async function deleteBlogPostLike(
  supabase: SupabaseClient<Database>,
  blogPostId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("blog_post_likes")
    .delete()
    .eq("blog_post_id", blogPostId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Add a like to a blog post
 */
export async function insertBlogPostLike(
  supabase: SupabaseClient<Database>,
  blogPostId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("blog_post_likes")
    .insert({ blog_post_id: blogPostId, user_id: userId });

  if (error) throw error;
}

/**
 * Remove a bookmark from a blog post
 */
export async function deleteBlogPostBookmark(
  supabase: SupabaseClient<Database>,
  blogPostId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("blog_post_bookmarks")
    .delete()
    .eq("blog_post_id", blogPostId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Add a bookmark to a blog post
 */
export async function insertBlogPostBookmark(
  supabase: SupabaseClient<Database>,
  blogPostId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("blog_post_bookmarks")
    .insert({ blog_post_id: blogPostId, user_id: userId });

  if (error) throw error;
}

export interface BlogPostsListOptions {
  currentPage: number;
  itemsPerPage: number;
  userId?: string;
  searchQuery?: string;
}

export interface BlogPostsListResult {
  blogPosts: any[];
  count: number;
}

/**
 * Fetch blog posts list with optional user ID filter and search query
 */
export async function getBlogPostsList(
  supabase: SupabaseClient<Database>,
  { currentPage, itemsPerPage, userId, searchQuery }: BlogPostsListOptions
): Promise<BlogPostsListResult> {
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  let query = supabase
    .from("blog_posts")
    .select(`
      *,
      author:profiles!user_id(id, username, full_name, avatar_url, tagline, certified),
      blog_post_comments(id),
      blog_post_likes(id, user_id),
      blog_post_bookmarks(blog_post_id, user_id)
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
    blogPosts: data || [],
    count: count || 0,
  };
}

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export async function getBlogPostDetail(
  supabase: SupabaseClient<Database>,
  idOrSlug: string
) {
  let query = supabase
    .from("blog_posts")
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

/**
 * Latest posts by one author, newest first, leaving out the post currently being read.
 * This is a nicety under the post, so a failed lookup yields an empty list rather than breaking the page.
 */
export async function getAuthorRecentBlogPosts(
  supabase: SupabaseClient<Database>,
  userId: string,
  excludeId: string,
  limit = 3
) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, created_at")
    .eq("user_id", userId)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load the author's other blog posts:", error);
    return [];
  }
  return data || [];
}

export async function getBlogPostIdBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

export const getBlogPostIdBySlugCached = (
  supabase: SupabaseClient<Database>,
  slug: string
) => {
  return unstable_cache(
    async () => {
      return getBlogPostIdBySlug(supabase, slug);
    },
    ["blog-post-id-by-slug", slug],
    {
      revalidate: 3600,
      tags: ["blog-post-all", `blog-post-slug-${slug}`],
    }
  )();
};

export const getBlogPostDetailCached = async (
  supabase: SupabaseClient<Database>,
  idOrSlug: string
) => {
  let actualId = idOrSlug;
  if (!isUUID(idOrSlug)) {
    const resolvedId = await getBlogPostIdBySlugCached(supabase, idOrSlug);
    if (!resolvedId) return null;
    actualId = resolvedId;
  }

  return unstable_cache(
    async () => {
      return getBlogPostDetail(supabase, actualId);
    },
    ["blog-post-detail-by-id", actualId],
    {
      revalidate: 3600,
      tags: ["blog-post-all", `blog-post-${actualId}`, `blog-post-${idOrSlug}`],
    }
  )();
};
