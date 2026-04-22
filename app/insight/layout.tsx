import { Metadata } from "next";

export const metadata: Metadata = {
  title: "사이드프로젝트 기획·개발·수익화 인사이트 | SYDE",
  description: "사이드프로젝트 기획, 개발, 수익화까지. 직접 만들고 운영한 1인개발자·솔로프리너들의 실전 인사이트 아티클.",
  alternates: {
    canonical: "/insight",
  },
};

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
