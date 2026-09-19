import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface AuthorRecentBlogPost {
  id: string;
  slug: string | null;
  title: string;
  created_at: string;
}

interface AuthorCardProps {
  author: {
    id: string;
    name: string;
    tagline: string | null;
    avatarUrl: string | null;
  };
  recentPosts: AuthorRecentBlogPost[];
}

/** End-of-post card: who wrote it, a way to their profile, and their latest posts to keep reading. */
export function AuthorCard({ author, recentPosts }: AuthorCardProps) {
  return (
    <section className="w-full max-w-3xl mx-auto flex flex-col gap-5 rounded-[12px] border border-[#E5E5E5] p-5 md:p-6 mt-6 mb-10">
      <Link href={`/@${author.id}`} className="flex items-center gap-3 w-fit">
        <Avatar className="size-12">
          <AvatarImage src={author.avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="bg-[#D9D9D9]">{author.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-[16px] font-semibold text-sydeblue">{author.name}</span>
          {author.tagline && <span className="text-[13px] text-[#777]">{author.tagline}</span>}
        </div>
      </Link>

      {recentPosts.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-[13px] font-semibold text-[#999]">{author.name}님의 다른 글</h3>
          <ul className="flex flex-col divide-y divide-[#F0F0F0]">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug || post.id}`}
                  className="flex items-baseline justify-between gap-4 py-3 hover:text-sydeblue"
                >
                  <span className="min-w-0 truncate text-[15px] font-medium">{post.title}</span>
                  <span className="shrink-0 text-[12px] text-[#999]">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko }).replace("약 ", "")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
