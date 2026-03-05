import { createClient } from "@/lib/supabase/server";
import { LogListWrapper } from "@/components/log/log-list-wrapper";
import { getOptimizedLogs } from "@/lib/queries/log-queries";

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

  // LCP Optimization: Prefetch initial logs on the server side
  const initialLogs = await getOptimizedLogs(supabase, {
    currentUserId: user?.id || null,
    currentPage: 1,
    logsPerPage: 20, // Match LOGS_PER_PAGE in log-list.tsx
  });

  return <LogListWrapper user={profile} avatarUrl={avatarUrl} initialLogs={initialLogs} />;
}
