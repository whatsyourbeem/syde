import React from "react";
import { createClient } from "@/lib/supabase/server";
import { BlogFeed } from "@/components/blog/blog-feed";
import { fetchBlogPostsAction } from "@/app/blog/blog-data-actions";
const ITEMS_PER_PAGE = 18;

interface BlogPageProps {
  searchParams: Promise<{ user?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { user: filterByUserId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("avatar_url, full_name, username").eq("id", user.id).single()
    : { data: null };

  const initialPosts = await fetchBlogPostsAction({
    currentPage: 1,
    itemsPerPage: ITEMS_PER_PAGE,
    currentUserId: user?.id || null,
    userId: filterByUserId,
  });

  return (
    <>
      {/* Main Content (Client Component Feed) */}
      <BlogFeed
        initialPosts={initialPosts}
        currentUserId={user?.id || null}
        currentUser={profile ? { name: profile.full_name || profile.username || "", avatarUrl: profile.avatar_url } : null}
        filterByUserId={filterByUserId}
      />
    </>
  );
}
