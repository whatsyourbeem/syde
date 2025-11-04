import Link from "next/link";
import { Tables } from "@/types/database.types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPlainTextFromTiptapJson } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CertifiedBadge } from "@/components/ui/certified-badge";

type Profile = Tables<"profiles">;
type ClubForumPost = Tables<"club_forum_posts"> & { author: Profile | null };

interface ClubPostListProps {
  posts: ClubForumPost[];
  clubId: string;
  currentPage: number;
  postsPerPage: number;
  totalPostsCount: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export default function ClubPostList({
  posts,
  clubId,
  currentPage,
  postsPerPage,
  totalPostsCount,
  onPageChange,
  isLoading,
}: ClubPostListProps) {
  if (!posts || posts.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">아직 게시글이 없습니다.</p>
    );
  }

  return (
    <div>
      <ul>
        {posts.map((post) => (
          <li key={post.id} className="py-4 px-4 hover:bg-gray-50 border-b">
            <Link href={`/club/${clubId}/post/${post.id}`} className="block">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold truncate">{post.title}</h3>
              </div>
              {post.content && (
                <div className="mt-2 text-sm text-gray-700 line-clamp-2">
                  {getPlainTextFromTiptapJson(post.content)}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Avatar className="size-5">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback>{post.author?.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-black">
                    {post.author?.full_name ||
                      post.author?.username ||
                      "Unknown User"}
                  </span>
                  {post.author?.certified && <CertifiedBadge size="sm" />}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {" "}
                {/* Added mt-2 for spacing */}
                {new Date(post.created_at!).toLocaleString(undefined, {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {/* Pagination Controls */}
      {totalPostsCount > postsPerPage && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            이전
          </Button>
          {Array.from(
            { length: Math.ceil(totalPostsCount / postsPerPage) },
            (_, i) => i + 1
          ).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={isLoading}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={
              currentPage === Math.ceil(totalPostsCount / postsPerPage) ||
              isLoading
            }
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
