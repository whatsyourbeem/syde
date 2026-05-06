import { createClient } from "@/lib/supabase/server";
import { FeedListWrapper } from "@/components/feed/feed-list-wrapper";
import { getUnifiedFeed } from "@/lib/queries/feed-queries";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  const avatarUrl =
    profile?.avatar_url && profile.updated_at
      ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}`
      : null;

  // LCP Optimization: Prefetch initial feed on the server side
  const initialFeed = await getUnifiedFeed(supabase, {
    currentUserId: user?.id || null,
    currentPage: 1,
    logsPerPage: 20,
  });

  return (
    <>
      <h1 className="sr-only">사이드프로젝트 실시간 피드 - SYDE 피드</h1>
      <FeedListWrapper user={profile} avatarUrl={avatarUrl} initialFeed={initialFeed} />
    </>
  );
}
