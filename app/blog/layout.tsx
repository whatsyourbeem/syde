import { Metadata } from "next";
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

// No cookies/auth are read here — BlogLayoutContent resolves the viewer's own
// session client-side via context/AuthContext.tsx instead, so every page under
// this layout (including /blog/[id]) stays eligible for the Full Route Cache.
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <BlogLayoutContent
      sydePick={<SydePickSidebarCard />}
      banner={<Banner position={BANNER_POSITIONS.LOG_SIDEBAR} />}
    >
      {children}
    </BlogLayoutContent>
  );
}
