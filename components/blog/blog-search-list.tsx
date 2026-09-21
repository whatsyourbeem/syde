'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { BlogCard } from './blog-card';
import { Button } from '@/components/ui/button';
import { getBlogPostsList } from '@/lib/queries/blog-queries';

import { blogKeys } from '@/lib/queries/query-keys';

const ITEMS_PER_PAGE = 12;

interface BlogSearchListProps {
  searchQuery: string;
}

export function BlogSearchList({ searchQuery }: BlogSearchListProps) {
  const supabase = createClient();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: blogKeys.list({ searchQuery, currentPage }),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { blogPosts: postsData, count } = await getBlogPostsList(supabase, {
        currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        searchQuery,
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
          hasLiked: user ? item.blog_post_likes?.some((l: any) => l.user_id === user.id) : false,
          hasBookmarked: user ? item.blog_post_bookmarks?.some((b: any) => b.user_id === user.id) : false
        },
        currentUserId: user?.id || null
      }));

      return {
        blogPosts: formattedPosts,
        count: count || 0,
      };
    },
  });

  if (isLoading) return <div className="text-center py-10">블로그 검색 중...</div>;
  if (isError) return <div className="text-center py-10 text-red-500">Error: {(error as Error).message}</div>;

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {data?.blogPosts.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">검색 결과가 없습니다.</p>
      ) : (
        <div className="flex w-full flex-col divide-y divide-[#F0F0F0]">
          {data?.blogPosts.map((blogPost) => (
            <BlogCard key={blogPost.id} {...blogPost} />
          ))}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              variant={currentPage === i + 1 ? 'default' : 'outline'}
              size="sm"
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
