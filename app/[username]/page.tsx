import { createClient } from "@/lib/supabase/server";
import { redirect, permanentRedirect } from "next/navigation";
import { ProfileIdentityHeader } from "@/components/user/profile-identity-header";
import { ProfileEvidenceBar } from "@/components/user/profile-evidence-bar";
import { ProfileCardBody } from "@/components/user/profile-card-body";
import { ProfileSocialLinks } from "@/components/user/profile-social-links";
import { getInitialHtmlFromTiptap } from "@/components/common/tiptap-server-extensions";
import { getProfileByUsernameCached } from "@/lib/queries/profile-queries";
import { getProfileStatsCached } from "@/lib/queries/profile-stats-queries";
import { ProfileTabs, ProfileTab } from "@/components/user/profile-tabs";
import { ProfileBlogTab } from "@/components/user/profile-blog-tab";
import { fetchBlogPostsAction } from "@/app/blog/blog-data-actions";
import { getFeaturedShowcases } from "@/lib/queries/profile-pinned-showcases-queries";

import { Metadata, ResolvingMetadata } from "next";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}

const BLOG_PAGE_SIZE = 10;
const SITE_DEFAULT_OG_IMAGE = "/we-are-syders.png";
const DESCRIPTION_MAX_LENGTH = 120;

/** ?tab= 값을 검증하고, 없거나 잘못되면 소개 탭으로 폴백한다. */
function resolveTab(rawTab: string | string[] | undefined): ProfileTab {
  const tab = Array.isArray(rawTab) ? rawTab[0] : rawTab;
  return tab === "blog" ? "blog" : "about";
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** 스토리 HTML에서 내용이 있는 첫 문단의 텍스트만 뽑는다. */
function extractFirstParagraph(html: string): string {
  for (const match of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
    const text = match[1]
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity] ?? entity)
      .replace(/\s+/g, " ")
      .trim();
    if (text) return text;
  }
  return "";
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
  { params, searchParams }: UserProfilePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username: rawParam } = await params;
  const { username } = normalizeUsernameParam(rawParam);
  const { tab: rawTab } = await searchParams;
  const supabase = await createClient();

  const profile = await getProfileByUsernameCached(supabase, username);

  if (!profile) {
    return {
      title: "User Not Found - SYDE",
    };
  }

  const displayName = profile.full_name || profile.username;
  const title = `${displayName} (@${profile.username}) - SYDE`;
  const firstParagraph = extractFirstParagraph(getInitialHtmlFromTiptap(profile.bio));
  const descriptionSource = firstParagraph || profile.tagline?.trim() || "";
  const description = descriptionSource
    ? truncate(descriptionSource, DESCRIPTION_MAX_LENGTH)
    : `${displayName}님의 SYDE 프로필`;
  const images = [profile.avatar_url || SITE_DEFAULT_OG_IMAGE];

  const tab = resolveTab(rawTab);
  const canonical = `/@${profile.username}?tab=${tab}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      images,
      type: "profile",
      url: canonical,
    },
  };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: UserProfilePageProps) {
  const { username: rawParam } = await params;
  const { tab: rawTab } = await searchParams;
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

  const stats = await getProfileStatsCached(supabase, profile.id);
  const activeTab = resolveTab(rawTab);

  // 선택된 탭의 내용만 서버에서 가져와 공유 링크로 들어와도 첫 화면에 보이게 한다.
  const [featuredShowcases, blogPage] = await Promise.all([
    activeTab === "about"
      ? getFeaturedShowcases(supabase, profile.id, user?.id || null)
      : Promise.resolve([]),
    activeTab === "blog"
      ? fetchBlogPostsAction({
          itemsPerPage: BLOG_PAGE_SIZE,
          userId: profile.id,
          currentUserId: user?.id || null,
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="flex-1 w-full flex flex-col h-full">
      <div className="w-full max-w-[850px] mx-auto flex-1 flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col">
          <ProfileIdentityHeader profile={profile} />
          <ProfileSocialLinks
            username={profile.username || ""}
            displayName={profile.full_name || profile.username || "Anonymous"}
            link={profile.link}
            contactEmail={profile.contact_email}
            githubUsername={profile.github_username}
            twitterUsername={profile.twitter_username}
            instagramUsername={profile.instagram_username}
          />
          <ProfileEvidenceBar stats={stats} />
        </div>
        <ProfileTabs activeTab={activeTab} blogPostsCount={stats.blogPostsCount} />
        <div id="profile-tabpanel" role="tabpanel" aria-labelledby={`profile-tab-${activeTab}`}>
          {activeTab === "blog" && blogPage ? (
            <ProfileBlogTab
              userId={profile.id}
              currentUserId={user?.id || null}
              isOwnProfile={isOwnProfile}
              initialPosts={blogPage.blogPosts}
              initialCursor={blogPage.nextCursor}
            />
          ) : (
            <ProfileCardBody
              profile={profile}
              isOwnProfile={isOwnProfile}
              hasBlogPosts={stats.blogPostsCount > 0}
              initialHtml={initialHtml}
              featuredShowcases={featuredShowcases}
            />
          )}
        </div>
      </div>
    </div>
  );
}
