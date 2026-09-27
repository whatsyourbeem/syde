"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { fetchBlogPostsAction } from "@/app/blog/blog-data-actions";
import { BlogCard } from "@/components/blog/blog-card";
import { SectionHeader } from "@/components/user/section-header";

interface UserBlogMiniListProps {
  userId: string;
  currentUserId: string | null;
}

export function UserBlogMiniList({ userId, currentUserId }: UserBlogMiniListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-blog-mini-list", userId, currentUserId],
    queryFn: () => fetchBlogPostsAction({ currentPage: 1, itemsPerPage: 5, userId, currentUserId }),
    staleTime: 30000,
  });

  const posts = data?.blogPosts || [];

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader title="작성한 블로그">
        <Link
          href={`/blog?user=${userId}`}
          className="flex items-center gap-0.5 text-[#777777] text-xs font-bold hover:text-sydeblue transition-colors"
        >
          전체보기
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </SectionHeader>

      {isLoading && (
        <p className="text-sm text-[#777777] py-4 text-center">불러오는 중...</p>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="flex items-center justify-center h-[81px] text-center px-4 bg-[#FAFAFA] rounded-xl">
          <p className="text-[#777777] text-sm font-light leading-[150%]">
            아직 작성한 블로그가 없어요.
          </p>
        </div>
      )}

      {posts.length > 0 && (
        <div className="flex flex-col divide-y divide-[#F0F0F0]">
          {posts.map((post) => (
            <BlogCard key={post.id} {...post} size="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
