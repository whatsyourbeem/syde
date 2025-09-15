"use server";

import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/types/database.types";

type Profile = Tables<"profiles">;
type ClubForumPost = Tables<"club_forum_posts"> & { author: Profile | null };

export async function getPaginatedClubPosts(
  forumId: string,
  currentPage: number,
  postsPerPage: number
): Promise<{ posts: ClubForumPost[]; totalCount: number }> {
  const supabase = await createClient();
  const from = (currentPage - 1) * postsPerPage;
  const to = from + postsPerPage - 1;

  const { data, count, error } = await supabase
    .from("club_forum_posts")
    .select("*, author:profiles(*)", { count: "exact" })
    .eq("forum_id", forumId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching paginated club posts:", error);
    return { posts: [], totalCount: 0 };
  }

  const posts: ClubForumPost[] = data.map((post) => ({
    ...post,
    author: post.author as Profile | null,
  }));

  return { posts, totalCount: count || 0 };
}