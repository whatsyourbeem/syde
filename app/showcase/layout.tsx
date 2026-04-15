import { createClient } from "@/lib/supabase/server";
import { ShowcaseLayoutContent } from "@/components/showcase/showcase-layout-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "쇼케이스 | SYDE",
  description: "사이드프로젝트 쇼케이스: 다양한 IT 메이커들의 웹/앱 프로덕트를 확인하세요",
  alternates: {
    canonical: "/showcase",
  },
};

export default async function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let avatarUrl = null;
  if (user) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*, updated_at")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile for ShowcaseForm:", profileError);
    } else if (data) {
      profile = data;
      avatarUrl =
        profile.avatar_url && profile.updated_at
          ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}`
          : profile.avatar_url;
    }
  }

  return (
    <>
      <ShowcaseLayoutContent
        user={user}
        profile={profile}
        avatarUrl={avatarUrl}
      >
        {children}
      </ShowcaseLayoutContent>
    </>
  );
}
