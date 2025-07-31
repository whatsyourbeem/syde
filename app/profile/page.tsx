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
  let link = null;
  let tagline = null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url, link, tagline, updated_at')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found (new user)
    console.error('Error fetching profile:', profileError);
  } else if (profile) {
    username = profile.username;
    fullName = profile.full_name;
    link = profile.link;
    tagline = profile.tagline;
    // Add cache-buster to avatarUrl
    avatarUrl = profile.avatar_url
      ? `${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : ''}`
      : null;
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4 mt-8">프로필 관리</h2>
        <p className="text-muted-foreground mb-4">
          프로필로 당신의 SYDE를 표현해주세요.
        </p>
        <div className="border-b py-2 mb-4"></div>
        {/* <div className="h-[17px]"></div> */}
        <ProfileForm
          className="my-4"
          userId={user.id}
          username={username}
          fullName={fullName}
          avatarUrl={avatarUrl}
          link={link}
          tagline={tagline}
        />
      </div>
    </div>
  );
}
