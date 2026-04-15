import { createClient } from "@/lib/supabase/server";
import { ShowcaseHeader } from "@/components/showcase/showcase-header";
import { ShowcaseLayoutContent } from "@/components/showcase/showcase-layout-content";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "사이드프로젝트 쇼케이스: IT 서비스 포트폴리오 및 레퍼런스 | SYDE",
  description: "기획부터 개발까지, 다양한 직군의 메이커들이 완성한 웹/앱 프로덕트를 확인하세요. SYDE 메이커들의 프로젝트에서 영감을 얻고 인사이트를 나누어보세요.",
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
