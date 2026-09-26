import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/user/profile-form";

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
  let tags: string[] | null = null;
  let contactEmail: string | null = null;
  let githubUsername: string | null = null;
  let twitterUsername: string | null = null;
  let instagramUsername: string | null = null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url, link, tagline, tags, contact_email, github_username, twitter_username, instagram_username, updated_at')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching profile:', profileError);
  } else if (profile) {
    username = profile.username;
    fullName = profile.full_name;
    link = profile.link;
    tagline = profile.tagline;
    tags = profile.tags;
    contactEmail = profile.contact_email;
    githubUsername = profile.github_username;
    twitterUsername = profile.twitter_username;
    instagramUsername = profile.instagram_username;
    avatarUrl = profile.avatar_url
      ? `${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : ''}`
      : null;
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="w-full max-w-[850px] mx-auto flex flex-col">
        <div className="w-full flex flex-col items-center py-5">
          <div className="w-full max-w-[600px] px-5 sm:px-15 md:px-20 lg:px-[60px] flex flex-col gap-6">
            <ProfileForm
              userId={user.id}
              username={username}
              fullName={fullName}
              avatarUrl={avatarUrl}
              link={link}
              tagline={tagline}
              tags={tags}
              contactEmail={contactEmail}
              githubUsername={githubUsername}
              twitterUsername={twitterUsername}
              instagramUsername={instagramUsername}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
