import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import TiptapViewer from "@/components/common/tiptap-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";



interface ClubPostDetailPageProps {
  params: Promise<{
    club_id: string;
    post_id: string;
  }>;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

export default async function ClubPostDetailPage({ params }: ClubPostDetailPageProps) {
  const supabase = await createClient();
  const { post_id } = await params;

  const { data: post, error } = await supabase
    .from("club_forum_posts")
    .select("*, profiles(username, avatar_url, full_name)")
    .eq("id", post_id)
    .single();

  if (error || !post) {
    console.error("Error fetching post:", error);
    notFound();
  }

  const author = post.profiles;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
        <Avatar className="size-8">
          <AvatarImage src={author?.avatar_url || undefined} />
          <AvatarFallback>{author?.username?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <span className="font-semibold">{author?.full_name || author?.username || 'Unknown User'}</span>
        <span className="text-xs">•</span>
        <span className="text-xs">{formatDate(post.created_at)}</span>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
        {post.content && <TiptapViewer content={post.content} />}
      </div>

      {/* Add comments section or other post interactions here later */}
    </div>
  );
}
