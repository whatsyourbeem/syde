import { createClient } from "@/lib/supabase/server";
import { ShowcaseListWrapper } from "@/components/showcase/showcase-list-wrapper";
import { fetchLatestAwardedShowcase, fetchShowcasesAction } from "@/app/showcase/showcase-data-actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Showcase - SYDE 쇼케이스",
  description: "사이드프로젝트 메이커들의 결과물을 확인하고 영감을 얻으세요.",
  openGraph: {
    title: "Showcase - SYDE 쇼케이스",
    description: "사이드프로젝트 메이커들의 결과물을 확인하고 영감을 얻으세요.",
    images: ["/we-are-syders.png"],
  },
};

export default async function ShowcasePage() {
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

  // Parallel fetch latest awarded showcase and initial showcases
  const [latestAwardedShowcase, initialShowcases] = await Promise.all([
    fetchLatestAwardedShowcase(user?.id),
    fetchShowcasesAction({
      currentUserId: user?.id || null,
      currentPage: 1,
      showcasesPerPage: 20,
    }),
  ]);

  return (
    <ShowcaseListWrapper 
      user={profile} 
      avatarUrl={avatarUrl} 
      latestAwardedShowcase={latestAwardedShowcase}
      initialShowcases={initialShowcases}
    />
  );
}
