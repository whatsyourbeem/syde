import { Metadata } from "next";

export const metadata: Metadata = {
  title: "클럽 | SYDE - 사이드프로젝트 커뮤니티 플랫폼",
  description: "사이드프로젝트 주제별 클럽. 같은 관심사의 1인개발자·메이커들과 스터디·네트워킹을 정기적으로 이어가요.",
  alternates: {
    canonical: "/club",
  },
};

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
