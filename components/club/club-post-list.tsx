import Link from "next/link";
import { Tables } from "@/types/database.types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPlainTextFromTiptapJson } from "@/lib/utils";

type Profile = Tables<"profiles">;
type ClubForumPost = Tables<"club_forum_posts"> & { author: Profile | null };

interface ClubPostListProps {
  posts: ClubForumPost[];
  clubId: string;
}

export default function ClubPostList({ posts, clubId }: ClubPostListProps) {
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
            <Link
              href={`/socialing/club/${clubId}/post/${post.id}`}
              className="block"
            >
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
                <span className="text-sm text-black">
                  {post.author?.full_name ||
                    post.author?.username ||
                    "Unknown User"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {" "}
                {/* Added mt-2 for spacing */}
                {new Date(post.created_at!).toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
