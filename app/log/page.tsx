import { createClient } from "@/lib/supabase/server";
import { LogListWrapper } from "@/components/log/log-list-wrapper";

export default async function LogPage() {
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

  return <LogListWrapper user={profile} avatarUrl={avatarUrl} />;
}
