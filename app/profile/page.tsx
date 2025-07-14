import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  let username = null;
  let fullName = null;
  let avatarUrl = null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found (new user)
    console.error('Error fetching profile:', profileError);
  } else if (profile) {
    username = profile.username;
    fullName = profile.full_name;
    avatarUrl = profile.avatar_url;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="flex-1 flex flex-col gap-20 max-w-4xl px-3">
        <h2 className="text-2xl font-bold mb-8">Your Profile</h2>
        <ProfileForm
          userId={user.id}
          username={username}
          fullName={fullName}
          avatarUrl={avatarUrl}
        />
      </div>
    </div>
  );
}
