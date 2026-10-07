"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { fetchBlogPostsAction } from "@/app/blog/blog-data-actions";
import { BlogCard, BlogCardProps } from "@/components/blog/blog-card";

interface ProfileBlogTabProps {
  userId: string;
  currentUserId: string | null;
  isOwnProfile: boolean;
  initialPosts: BlogCardProps[];
  initialCursor: string | null;
}

const PAGE_SIZE = 10;

export function ProfileBlogTab({
  userId,
  currentUserId,
  isOwnProfile,
  initialPosts,
  initialCursor,
}: ProfileBlogTabProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    startTransition(async () => {
      const result = await fetchBlogPostsAction({
        itemsPerPage: PAGE_SIZE,
        cursor,
        userId,
        currentUserId,
      });
      setPosts((prev) => [...prev, ...result.blogPosts]);
      setCursor(result.nextCursor);
    });
  };

  if (posts.length === 0) {
    return (
      <div className="px-5 py-4 md:px-8 md:py-6">
        <div className="flex flex-col items-center justify-center gap-3 min-h-[120px] text-center px-4 bg-[#FAFAFA] rounded-xl">
          <p className="text-[#777777] text-sm font-light leading-[150%]">
            {isOwnProfile
              ? "아직 쓴 글이 없어요. 첫 글을 남겨보세요."
              : "아직 작성한 글이 없어요."}
          </p>
          {isOwnProfile && (
            <Link
              href="/blog/write"
              className="px-4 py-2 rounded-full bg-sydeblue text-white text-[13px] font-bold hover:opacity-90 transition-opacity"
            >
              글쓰기
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-2 md:px-8 flex flex-col">
      <div className="flex flex-col divide-y divide-[#F0F0F0]">
        {posts.map((post) => (
          <BlogCard key={post.id} {...post} size="compact" />
        ))}
      </div>
      {cursor && (
        <button
          type="button"
          onClick={loadMore}
          disabled={isPending}
          className="mt-4 mx-auto px-5 py-2 rounded-full border border-[#E5E5E5] text-[13px] font-bold text-[#555555] hover:border-sydeblue hover:text-sydeblue transition-colors disabled:opacity-50"
        >
          {isPending ? "불러오는 중..." : "더보기"}
        </button>
      )}
    </div>
  );
}
