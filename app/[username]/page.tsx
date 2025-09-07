import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProfileContentTabs } from "@/components/user/profile-content-tabs";
import { Separator } from "@/components/ui/separator";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch the profile data for the given username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, bio, link, tagline, updated_at"
    )
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    // If profile not found, redirect to home or a 404 page
    redirect("/"); // Or /404
  }

  // Check if the current user is viewing their own profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id || null; // Get current user ID
  const isOwnProfile = !!(user && user.id === profile.id);

  const avatarUrlWithCacheBuster = profile.avatar_url
    ? `${profile.avatar_url}?t=${
        profile.updated_at ? new Date(profile.updated_at).getTime() : ""
      }`
    : null;

  return (
    <div className="flex-1 w-full flex flex-col p-5 h-full">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        <div className="flex flex-row-reverse items-center gap-6 p-6 rounded-lg bg-card mb-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            {avatarUrlWithCacheBuster ? (
              <Image
                src={avatarUrlWithCacheBuster}
                alt="Avatar"
                fill
                sizes="96px"
                className="rounded-full object-cover aspect-square"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-muted-foreground text-4xl font-bold">
                {profile.full_name
                  ? profile.full_name[0].toUpperCase()
                  : profile.username
                  ? profile.username[0].toUpperCase()
                  : "U"}
              </div>
            )}
          </div>
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:items-baseline gap-2">
              <h1 className="text-2xl font-bold leading-tight">
                {profile.full_name
                  ? profile.full_name
                  : profile.username || "Anonymous"}
              </h1>
              {profile.full_name && profile.username && (
                <p className="text-muted-foreground text-sm">
                  @{profile.username}
                </p>
              )}
            </div>
            {profile.tagline && (
              <p className="mt-2 text-sm text-muted-foreground">
                {profile.tagline}
              </p>
            )}

            {isOwnProfile && (
              <div className="mt-4 flex gap-4 items-center">
                <Button asChild size="sm">
                  <Link href="/profile">프로필 편집</Link>
                </Button>
              </div>
            )}

            {profile.link && (
              <Link
                href={profile.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm mt-2 block"
              >
                {profile.link}
              </Link>
            )}
          </div>
        </div>
        <Separator className="hidden md:block" />
        <ProfileContentTabs
          isOwnProfile={isOwnProfile}
          profile={profile}
          currentUserId={currentUserId}
          className="flex-1"
        />
      </div>
    </div>
  );
}
