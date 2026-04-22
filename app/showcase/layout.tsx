import { createClient } from "@/lib/supabase/server";
import { ShowcaseLayoutContent } from "@/components/showcase/showcase-layout-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "사이드프로젝트 쇼케이스 - 1인개발자 프로젝트 | SYDE",
  description: "1인개발자·인디 메이커들의 사이드프로젝트 쇼케이스. 내 프로젝트를 등록하고 업보트를 받아보세요. 매주 SYDE Pick에 선정될 수 있어요.",
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
