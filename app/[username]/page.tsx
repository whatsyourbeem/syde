import { createClient } from "@/lib/supabase/server";
import { redirect, permanentRedirect } from "next/navigation";
import { ProfileIdentityHeader } from "@/components/user/profile-identity-header";
import { ProfileEvidenceBar } from "@/components/user/profile-evidence-bar";
import { ProfileCardBody } from "@/components/user/profile-card-body";
import { ProfileSocialLinks } from "@/components/user/profile-social-links";
import { ProfileFooter } from "@/components/user/profile-footer";
import { getInitialHtmlFromTiptap } from "@/components/common/tiptap-server-extensions";
import { getProfileByUsernameCached } from "@/lib/queries/profile-queries";
import { getProfileStatsCached } from "@/lib/queries/profile-stats-queries";
import { getFeaturedShowcases } from "@/lib/queries/profile-pinned-showcases-queries";

import { Metadata, ResolvingMetadata } from "next";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

/**
 * 라우트 파라미터를 정규화한다.
 * Next.js는 URL 세그먼트의 '@'를 '%40'으로 인코딩해 전달하므로 먼저 디코딩한 뒤
 * '@' 접두사 여부를 판별한다.
 */
function normalizeUsernameParam(rawParam: string): {
  hasAt: boolean;
  username: string;
} {
  let decoded = rawParam;
  try {
    decoded = decodeURIComponent(rawParam);
  } catch {
    // 잘못된 인코딩은 원본 그대로 사용 (어차피 조회 실패 → 리다이렉트)
  }
  const hasAt = decoded.startsWith("@");
  return { hasAt, username: hasAt ? decoded.slice(1) : decoded };
}

export async function generateMetadata(
  { params }: UserProfilePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username: rawParam } = await params;
  const { username } = normalizeUsernameParam(rawParam);
  const supabase = await createClient();

  const profile = await getProfileByUsernameCached(supabase, username);

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
      canonical: `/@${profile.username}`,
    },
    openGraph: {
      title,
      description,
      images,
      type: "profile",
      url: `/@${profile.username}`,
    },
  };
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { username: rawParam } = await params;
  const { hasAt, username } = normalizeUsernameParam(rawParam);
  const supabase = await createClient();

  // 정규 경로(/@username)로 통일: @ 없는 기존 링크는 301 리다이렉트
  if (!hasAt) {
    permanentRedirect(`/@${username}`);
  }

  // Fetch the profile data for the given username
  const profile = await getProfileByUsernameCached(supabase, username);

  if (!profile) {
    redirect("/");
  }

  // Check if the current user is viewing their own profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = !!(user && user.id === profile.id);

  const initialHtml = getInitialHtmlFromTiptap(profile.bio);

  const [stats, featuredShowcases] = await Promise.all([
    getProfileStatsCached(supabase, profile.id),
    getFeaturedShowcases(supabase, profile.id, user?.id || null),
  ]);

  return (
    <div className="flex-1 w-full flex flex-col h-full">
      <div className="w-full max-w-[850px] mx-auto flex-1 flex flex-col">
        <ProfileIdentityHeader profile={profile} isOwnProfile={isOwnProfile} stats={stats} />
        <ProfileEvidenceBar stats={stats} />
        <ProfileSocialLinks
          link={profile.link}
          contactEmail={profile.contact_email}
          githubUsername={profile.github_username}
          twitterUsername={profile.twitter_username}
          instagramUsername={profile.instagram_username}
        />
        <ProfileCardBody
          profile={profile}
          isOwnProfile={isOwnProfile}
          initialHtml={initialHtml}
          featuredShowcases={featuredShowcases}
        />
        <ProfileFooter
          displayName={profile.full_name || profile.username || "Anonymous"}
        />
      </div>
    </div>
  );
}
