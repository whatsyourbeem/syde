import { createClient } from "@/lib/supabase/server";
import { LogListServer } from "@/components/log/log-list-server";
import { LogCreateButton } from "@/components/log/log-create-button";

export const revalidate = 0;

export default async function LogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  const avatarUrl = profile?.avatar_url
    ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}`
    : null;

  return (
    <>
      <LogCreateButton user={profile} avatarUrl={avatarUrl} />
      <LogListServer currentUserId={user?.id || null} />
    </>
  );
}