import { ShowcaseLayoutContent } from "@/components/showcase/showcase-layout-content";
import { Metadata } from "next";
import { Banner } from "@/components/common/banner";
import { SydePickSidebarCard } from "@/components/showcase/syde-pick-sidebar-card";
import { BANNER_POSITIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "사이드프로젝트 쇼케이스 - 1인개발자 프로젝트 | SYDE",
  description: "1인개발자·솔로프리너들의 사이드프로젝트 쇼케이스. 내 프로젝트를 등록하고 업보트를 받아보세요. 매주 SYDE Pick에 선정될 수 있어요.",
  alternates: {
    canonical: "/showcase",
  },
  openGraph: {
    title: "사이드프로젝트 쇼케이스 - 1인개발자 프로젝트 | SYDE",
    description: "1인개발자·솔로프리너들의 사이드프로젝트 쇼케이스. 내 프로젝트를 등록하고 업보트를 받아보세요. 매주 SYDE Pick에 선정될 수 있어요.",
    images: ["/we-are-syders.png"],
  },
};

// No cookies/auth are read here — ShowcaseLayoutContent resolves the viewer's own
// session client-side via context/AuthContext.tsx instead, so every page under
// this layout (including /showcase/[showcase_id]) stays eligible for the Full
// Route Cache.
export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShowcaseLayoutContent
      sydePick={<SydePickSidebarCard />}
      banner={<Banner position={BANNER_POSITIONS.LOG_SIDEBAR} />}
    >
      {children}
    </ShowcaseLayoutContent>
  );
}
