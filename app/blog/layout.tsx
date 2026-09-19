import { Metadata } from "next";

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

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
