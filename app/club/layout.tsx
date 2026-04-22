import { Metadata } from "next";

export const metadata: Metadata = {
  title: "사이드프로젝트 클럽 · 관심사별 소모임 | SYDE",
  description: "사이드프로젝트 주제별 클럽. 관심사가 같은 1인개발자·솔로프리너들과 정기 스터디·네트워킹을 이어가요.",
  alternates: {
    canonical: "/club",
  },
};

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
