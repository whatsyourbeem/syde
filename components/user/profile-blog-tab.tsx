"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchBlogPostsAction } from "@/app/blog/blog-data-actions";
import { BlogCard, BlogCardProps } from "@/components/blog/blog-card";
import { InfiniteScrollTrigger } from "@/components/common/infinite-scroll-trigger";
import { LIST_STALE_TIME } from "@/lib/queries/query-keys";

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
  // 키가 ["blog-posts", ...]로 시작하면 좋아요·북마크 등 캐시 패치가 이 목록에도 반영된다.
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } =
    useInfiniteQuery({
      queryKey: ["blog-posts", "profile", userId],
      queryFn: ({ pageParam }) =>
        fetchBlogPostsAction({
          cursor: pageParam,
          itemsPerPage: PAGE_SIZE,
          userId,
          currentUserId,
        }),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: {
        pages: [{ blogPosts: initialPosts, nextCursor: initialCursor }],
        pageParams: [null],
      },
      staleTime: LIST_STALE_TIME,
    });

  const posts = data?.pages.flatMap((page) => page.blogPosts) ?? [];

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
      <InfiniteScrollTrigger
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isError={isFetchNextPageError}
      />
    </div>
  );
}
