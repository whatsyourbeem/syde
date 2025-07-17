import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LogCard } from "@/components/log-card";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";

type LogDetailPageProps = {
  params: {
    log_id: string;
  };
};

export default async function LogDetailPage({ params }: LogDetailPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: log, error } = await supabase
    .from("logs")
    .select("*, profiles(*), log_likes(user_id), log_comments(id)")
    .eq("id", params.log_id)
    .single();

  if (error || !log) {
    notFound();
  }

  const initialLikesCount = log.log_likes.length;
  const initialHasLiked = user
    ? log.log_likes.some(
        (like: { user_id: string }) => like.user_id === user.id
      )
    : false;
  const initialCommentsCount = log.log_comments.length;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <LogCard
        log={log}
        currentUserId={user?.id || null}
        initialLikesCount={initialLikesCount}
        initialHasLiked={initialHasLiked}
        initialCommentsCount={initialCommentsCount}
      />
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>
        <CommentForm logId={log.id} currentUserId={user?.id || null} />
        <CommentList logId={log.id} currentUserId={user?.id || null} />
      </div>
    </div>
  );
}
