import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProfileContentTabs } from "@/components/user/profile-content-tabs";
import { CertifiedBadge } from "@/components/ui/certified-badge";
import { getInitialHtmlFromTiptap } from "@/components/common/tiptap-server-extensions";
import { Settings } from "lucide-react";

import { Metadata, ResolvingMetadata } from "next";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(
  { params }: UserProfilePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, tagline, avatar_url")
    .eq("username", username)
    .single();

  if (!profile) {
    return {
      title: "User Not Found - SYDE",
    };
  }

  const displayName = profile.full_name || profile.username;
  const title = `${displayName} (@${profile.username}) - SYDE`;
  const description = profile.tagline || `${displayName}님의 프로필입니다.`;
  const images = profile.avatar_url ? [profile.avatar_url] : [];

  return {
    title,
    description,
    alternates: {
      canonical: `/${profile.username}`,
    },
    openGraph: {
      title,
      description,
      images,
      type: "profile",
      url: `/${profile.username}`,
    },
  };
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
      "id, username, full_name, avatar_url, bio, link, tagline, updated_at, certified"
    )
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    redirect("/");
  }

  // Check if the current user is viewing their own profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;
  const isOwnProfile = !!(user && user.id === profile.id);

  const avatarUrlWithCacheBuster = profile.avatar_url
    ? `${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : ""
    }`
    : null;

  const initialHtml = getInitialHtmlFromTiptap(profile.bio);

  return (
    <div className="flex-1 w-full flex flex-col h-full">
      <div className="w-full max-w-[850px] mx-auto flex-1 flex flex-col">
        {/* Title Section */}
        <div className="flex flex-row items-center h-[160px] md:h-auto md:flex-row md:items-center justify-center gap-0 md:gap-6 px-5 py-8 md:px-8 md:py-6 border-b-0 md:border-b-[0.5px] border-[#B7B7B7]">
          {/* Avatar (Left on mobile, Right on desktop) */}
          <div className="relative w-24 h-24 flex-shrink-0 md:order-last">
            {avatarUrlWithCacheBuster ? (
              <Image
                src={avatarUrlWithCacheBuster}
                alt="Avatar"
                fill
                sizes="96px"
                className="rounded-full object-cover aspect-square"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#D9D9D9] flex items-center justify-center text-sydeblue text-4xl font-bold">
                {profile.full_name
                  ? profile.full_name[0].toUpperCase()
                  : profile.username
                    ? profile.username[0].toUpperCase()
                    : "U"}
              </div>
            )}
          </div>

          {/* Text Block (Right on mobile, Left on desktop) */}
          <div className="flex-grow min-w-0 flex flex-col items-start px-5 gap-1 md:gap-3">
            {/* Name & Settings Row */}
            <div className="flex items-center justify-between w-full md:w-auto md:justify-start md:gap-2">
              <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-2">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold leading-tight text-sydeblue">
                    {profile.full_name
                      ? profile.full_name
                      : profile.username || "Anonymous"}
                  </h1>
                  {profile.certified && <CertifiedBadge size="lg" />}
                </div>
                {profile.full_name && profile.username && (
                  <span className="text-sm text-[#777777]">
                    @{profile.username}
                  </span>
                )}
              </div>

              {/* Mobile Settings Icon Button */}
              {isOwnProfile && (
                <Link
                  href="/profile"
                  className="md:hidden flex items-center justify-center w-8 h-8 bg-sydeblue text-[#EBF2F9] rounded-xl hover:bg-sydeblue/90 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Tagline */}
            {profile.tagline && (
              <p className="text-sm text-sydeblue">
                {profile.tagline}
              </p>
            )}

            {/* Desktop Edit Profile Button */}
            {isOwnProfile && (
              <Link
                href="/profile"
                className="hidden md:inline-flex mt-2 items-center gap-1 px-3 py-2 bg-sydeblue text-[#EBF2F9] text-sm font-bold rounded-xl hover:bg-sydeblue/90 transition-colors"
              >
                <Settings className="w-4 h-4" />
                프로필 편집
              </Link>
            )}
          </div>
        </div>

        {/* Main Content (Sidebar + Content) */}
        <ProfileContentTabs
          isOwnProfile={isOwnProfile}
          profile={profile}
          currentUserId={currentUserId}
          initialHtml={initialHtml}
          className="flex-1"
        />
      </div>
    </div>
  );
}
