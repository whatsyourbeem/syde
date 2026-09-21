import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BlogLayoutContent } from "@/components/blog/blog-layout-content";
import { Banner } from "@/components/common/banner";
import { SydePickSidebarCard } from "@/components/showcase/syde-pick-sidebar-card";
import { BANNER_POSITIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "사이드프로젝트 블로그 | SYDE",
  description: "사이드프로젝트 기획·개발·수익화 인사이트. 직접 만들고 운영해본 1인개발자·솔로프리너들의 실전 노하우와 만들면서 겪은 이야기를 블로그로 읽어보세요.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "사이드프로젝트 블로그 | SYDE",
    description: "사이드프로젝트 기획·개발·수익화 인사이트. 직접 만들고 운영해본 1인개발자·솔로프리너들의 실전 노하우와 만들면서 겪은 이야기를 블로그로 읽어보세요.",
    url: "/blog",
    images: ["/we-are-syders.png"],
  },
};

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let avatarUrl = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*, updated_at")
      .eq("id", user.id)
      .single();
    if (data) {
      profile = data;
      avatarUrl =
        data.avatar_url && data.updated_at
          ? `${data.avatar_url}?t=${new Date(data.updated_at).getTime()}`
          : data.avatar_url;
    }
  }

  return (
    <BlogLayoutContent
      user={user}
      profile={profile}
      avatarUrl={avatarUrl}
      sydePick={<SydePickSidebarCard />}
      banner={<Banner position={BANNER_POSITIONS.LOG_SIDEBAR} />}
    >
      {children}
    </BlogLayoutContent>
  );
}
