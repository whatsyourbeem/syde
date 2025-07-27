import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogList } from "@/components/log-list"; // Import LogList
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { UserActivityLogList } from "@/components/user-activity-log-list"; // Import UserActivityLogList

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
  const isOwnProfile = user && user.id === profile.id;

  const avatarUrlWithCacheBuster = profile.avatar_url
    ? `${profile.avatar_url}?t=${
        profile.updated_at ? new Date(profile.updated_at).getTime() : ""
      }`
    : null;

  return (
    <div className="flex-1 w-full flex flex-col items-center p-5">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        <div className="flex flex-row-reverse items-center gap-6 p-6 rounded-lg bg-card">
          <div className="relative w-24 h-24 flex-shrink-0">
            {avatarUrlWithCacheBuster ? (
              <Image
                src={avatarUrlWithCacheBuster}
                alt="Avatar"
                fill
                sizes="96px"
                className="rounded-full object-cover"
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
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold leading-tight">
                {profile.full_name || profile.username || "Anonymous"}
              </h1>
              {profile.username && (
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
            {isOwnProfile && (
              <div className="mt-4">
                <Button asChild size="sm">
                  <Link href="/profile">프로필 편집</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
        <Tabs defaultValue="bio" className="w-full">
          <TabsList className="flex w-full justify-center space-x-2">
            <TabsTrigger
              value="bio"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:font-bold"
            >
              자유 소개
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:font-bold"
            >
              작성한 로그
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger
                value="comments"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:font-bold"
              >
                좋아요/댓글
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="bio">
            <div className="mt-4 p-4 border rounded-lg bg-card">
              {profile.bio ? (
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
              ) : (
                <p className="text-muted-foreground text-center">작성된 자유 소개가 없습니다.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="logs">
            <LogList
              currentUserId={currentUserId}
              filterByUserId={profile.id}
            />
          </TabsContent>
          {isOwnProfile && (
            <TabsContent value="comments">
              <UserActivityLogList
                currentUserId={currentUserId}
                userId={profile.id}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
