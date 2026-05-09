import { createClient } from "@/lib/supabase/server";
import { FeedListWrapper } from "@/components/feed/feed-list-wrapper";
import { getUnifiedFeed } from "@/lib/queries/feed-queries";
import { getProfileByIdCached } from "@/lib/queries/profile-queries";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, initialFeed] = await Promise.all([
    user ? getProfileByIdCached(supabase, user.id) : Promise.resolve(null),
    getUnifiedFeed(supabase, {
      currentUserId: user?.id || null,
      currentPage: 1,
      logsPerPage: 20,
    }),
  ]);

  const avatarUrl =
    profile?.avatar_url && profile.updated_at
      ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}`
      : null;

  return (
    <>
      <h1 className="sr-only">사이드프로젝트 실시간 피드 - SYDE 피드</h1>
      <FeedListWrapper user={profile} avatarUrl={avatarUrl} initialFeed={initialFeed} />
    </>
  );
}
