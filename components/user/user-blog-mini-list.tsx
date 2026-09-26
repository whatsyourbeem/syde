"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronRight, Eye, HeartIcon } from "lucide-react";
import { fetchBlogPostsAction } from "@/app/blog/blog-data-actions";

interface UserBlogMiniListProps {
  userId: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function UserBlogMiniList({ userId }: UserBlogMiniListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-blog-mini-list", userId],
    queryFn: () => fetchBlogPostsAction({ currentPage: 1, itemsPerPage: 5, userId }),
    staleTime: 30000,
  });

  const posts = data?.blogPosts || [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span>✍️</span>
          <span className="font-bold text-base text-black">쓴 글</span>
        </div>
        <Link
          href={`/blog?user=${userId}`}
          className="flex items-center gap-0.5 text-[#777777] text-xs font-bold hover:text-sydeblue transition-colors"
        >
          전체보기
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading && (
        <p className="text-sm text-[#777777] py-4 text-center">불러오는 중...</p>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="flex items-center justify-center h-[81px] text-center px-4 bg-[#FAFAFA] rounded-xl">
          <p className="text-[#777777] text-sm font-light leading-[150%]">
            아직 쓴 글이 없어요.
          </p>
        </div>
      )}

      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug || post.id}`}
          prefetch={false}
          className="flex flex-col gap-0.5 p-2 rounded-lg hover:bg-[#FAFAFA] transition-colors"
        >
          <span className="text-sm font-bold text-black line-clamp-1">{post.title}</span>
          <div className="flex items-center gap-2 text-[11px] text-[#777777]">
            <span>{formatDate(post.createdAt)}</span>
            <span className="inline-flex items-center gap-0.5">
              <HeartIcon className="w-3 h-3" /> {post.stats.likes}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Eye className="w-3 h-3" /> {post.stats.views || 0}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
