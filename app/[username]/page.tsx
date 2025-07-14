import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface UserProfilePageProps {
  params: { username: string };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const supabase = await createClient();
  const { username } = params;

  // Fetch the profile data for the given username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, link, updated_at')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    // If profile not found, redirect to home or a 404 page
    redirect('/'); // Or /404
  }

  // Check if the current user is viewing their own profile
  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = user && user.id === profile.id;

  const avatarUrlWithCacheBuster = profile.avatar_url 
    ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}` 
    : null;

  return (
    <div className="flex-1 w-full flex flex-col items-center p-5">
      <div className="flex flex-col items-center gap-6 max-w-4xl w-full">
        {avatarUrlWithCacheBuster && (
          <Image
            src={avatarUrlWithCacheBuster}
            alt={`${profile.username || 'User'}'s avatar`}
            width={128}
            height={128}
            className="rounded-full object-cover border-2 border-primary"
          />
        )}
        <h1 className="text-3xl font-bold">{profile.full_name || profile.username}</h1>
        {profile.username && profile.full_name && (
          <p className="text-lg text-muted-foreground">@{profile.username}</p>
        )}
        {profile.bio && (
          <p className="text-center max-w-prose text-gray-700 dark:text-gray-300">{profile.bio}</p>
        )}
        {profile.link && (
          <Link
            href={profile.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {profile.link}
          </Link>
        )}

        {isOwnProfile && (
          <div className="mt-8">
            <Button asChild>
              <Link href="/profile">프로필 편집</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
