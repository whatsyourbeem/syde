import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import TiptapViewer from "@/components/common/tiptap-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClubPostCommentForm } from "@/components/club/comment/club-post-comment-form";
import { ClubPostCommentList } from "@/components/club/comment/club-post-comment-list";
import { ClubPostDetailHeader } from "@/components/club/club-post-detail-header";
import { CLUB_MEMBER_ROLES } from "@/lib/constants";

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
  const { club_id, post_id } = await params;
  const { data: { user } } = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from("club_forum_posts")
    .select("*, profiles(username, avatar_url, full_name)")
    .eq("id", post_id)
    .single();

  if (error || !post) {
    console.error("Error fetching post:", error);
    notFound();
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("owner_id")
    .eq("id", club_id)
    .single();

  if (!club) {
    notFound();
  }

  let memberRole = null;
  if (user) {
    const { data: member } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club_id)
      .eq('user_id', user.id)
      .single();
    if (member) {
      memberRole = member.role;
    }
  }

  const isAuthorized = memberRole === CLUB_MEMBER_ROLES.LEADER || memberRole === CLUB_MEMBER_ROLES.FULL_MEMBER;

  const author = post.profiles;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <ClubPostDetailHeader post={post} clubId={club_id} clubOwnerId={club.owner_id} user={user} />
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
        {isAuthorized ? (
          post.content && <TiptapViewer content={post.content} />
        ) : (
          <div className="p-8 text-center bg-secondary rounded-lg">
            <p className="text-secondary-foreground">
              이 게시글의 내용은 클럽의 정회원만 볼 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {isAuthorized && (
        <div className="mt-8 border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">댓글</h2>
          <ClubPostCommentForm postId={post.id} currentUserId={user?.id || null} />
          <ClubPostCommentList postId={post.id} currentUserId={user?.id || null} />
        </div>
      )}
    </div>
  );
}
