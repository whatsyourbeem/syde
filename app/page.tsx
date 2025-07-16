import { createClient } from "@/lib/supabase/server";
import { LogForm } from "@/components/log-form";
import { LogList } from "@/components/log-list";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let avatarUrl = null;
  let username = null;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url, username, updated_at')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile for LogForm:', profileError);
    } else if (profile) {
      avatarUrl = profile.avatar_url ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}` : null;
      username = profile.username;
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center p-5">
      <div className="w-full max-w-2xl mx-auto mb-8">
        <LogForm
          userId={user?.id || null}
          userEmail={user?.email || null}
          avatarUrl={avatarUrl}
          username={username}
        />
      </div>
      <LogList currentUserId={user?.id || null} />
    </main>
  );
}
