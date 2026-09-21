"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { BlogCard } from "./blog-card";
import { Button } from "@/components/ui/button";
import { CenteredLoading } from "@/components/ui/loading-states";

import { getBlogPostsList } from "@/lib/queries/blog-queries";

import { blogKeys } from "@/lib/queries/query-keys";

const ITEMS_PER_PAGE = 12;

interface BlogListProps {
  currentUserId: string | null;
  userId: string;
  showInteractions?: boolean;
}

export function BlogList({ currentUserId, userId, showInteractions = true }: BlogListProps) {
  const supabase = createClient();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: blogKeys.list({ userId, currentPage }),
    queryFn: async () => {
      const { blogPosts: postsData, count } = await getBlogPostsList(supabase, {
        currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        userId,
      });

      const formattedPosts = (postsData || []).map((item: any) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        createdAt: item.created_at,
        imageUrl: item.image_url,
        author: {
          id: item.user_id,
          username: item.author?.username,
          name: item.author?.full_name || item.author?.username || "알 수 없는 사용자",
          role: item.author?.tagline || "멤버",
          avatarUrl: item.author?.avatar_url
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
        currentUserId: currentUserId
      }));

      return {
        blogPosts: formattedPosts,
        count: count || 0,
      };
    },
  });

  if (isLoading) return <div className="text-center py-10"><CenteredLoading message="블로그 글 불러오는 중..." /></div>;
  if (isError) return <div className="text-center py-10 text-red-500">Error: {(error as Error).message}</div>;

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {data?.blogPosts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center text-muted-foreground">
          <p>아직 쓴 글이 없어요</p>
          {currentUserId === userId && (
            <Button asChild className="rounded-full bg-sydeblue px-5 text-white hover:bg-sydeblue/90">
              <Link href="/blog/write">글쓰기</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="flex w-full flex-col divide-y divide-[#F0F0F0] px-4 md:px-0">
          {data?.blogPosts.map((blogPost) => (
            <BlogCard key={blogPost.id} {...blogPost} showInteractions={showInteractions} />
          ))}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 mb-8 pb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            이전
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              disabled={isLoading}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
