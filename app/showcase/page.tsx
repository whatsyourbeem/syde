import { createClient } from "@/lib/supabase/server";
import { ShowcaseListWrapper } from "@/components/showcase/showcase-list-wrapper";
import { MainAwardBanner } from "@/components/showcase/main-award-banner";

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

  return (
    <>
      <MainAwardBanner />
      <ShowcaseListWrapper user={profile} avatarUrl={avatarUrl} />
    </>
  );
}
