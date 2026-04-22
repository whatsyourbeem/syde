import { Metadata } from "next";

export const metadata: Metadata = {
  title: "사이드프로젝트 기획·개발·수익화 인사이트 | SYDE",
  description: "사이드프로젝트 기획부터 수익화까지. 직접 만들고 운영해본 1인개발자·솔로프리너들의 실전 노하우를 아티클로 읽어보세요.",
  alternates: {
    canonical: "/insight",
  },
  openGraph: {
    title: "사이드프로젝트 기획·개발·수익화 인사이트 | SYDE",
    description: "사이드프로젝트 기획부터 수익화까지. 직접 만들고 운영해본 1인개발자·솔로프리너들의 실전 노하우를 아티클로 읽어보세요.",
    images: ["/we-are-syders.png"],
  },
};

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
