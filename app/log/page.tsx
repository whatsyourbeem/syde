import { createClient } from "@/lib/supabase/server";
import { LogListWrapper } from "@/components/log/log-list-wrapper";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let avatarUrl = null;
  if (user) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*, updated_at")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile for LogForm:", profileError);
    } else if (data) {
      profile = data;
      avatarUrl =
        profile.avatar_url && profile.updated_at
          ? `${profile.avatar_url}?t=${new Date(
              profile.updated_at
            ).getTime()}`
          : profile.avatar_url;
    }
  }

  return <LogListWrapper user={profile} avatarUrl={avatarUrl} />;
}