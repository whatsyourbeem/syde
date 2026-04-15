import { Metadata } from "next";

export const metadata: Metadata = {
  title: "인사이트 | SYDE - 사이드프로젝트 커뮤니티 플랫폼",
  description: "사이드프로젝트 & 1인 창업 인사이트: 기획부터 수익화까지. 인디 메이커의 성장을 돕는 실전 인사이트",
  alternates: {
    canonical: "/insight",
  },
};

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
