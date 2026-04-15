import { Metadata } from "next";

export const metadata: Metadata = {
  title: "클럽 | SYDE - 사이드프로젝트 커뮤니티 플랫폼",
  description: "관심사가 맞는 사람들과 모여 스터디, 네트워킹을 함께하며 성장해요.",
  alternates: {
    canonical: "/club",
  },
};

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
