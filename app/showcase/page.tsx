import { createClient } from "@/lib/supabase/server";
import { ShowcaseListWrapper } from "@/components/showcase/showcase-list-wrapper";
import { ShowcaseHeader } from "@/components/showcase/showcase-header";
import { redirect } from "next/navigation";
import { fetchLatestAwardedShowcase } from "@/app/showcase/showcase-data-actions";

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

  // Fetch latest awarded showcase
  const latestAwardedShowcase = await fetchLatestAwardedShowcase(user?.id);

  return (
    <ShowcaseListWrapper 
      user={profile} 
      avatarUrl={avatarUrl} 
      latestAwardedShowcase={latestAwardedShowcase}
    />
  );
}
