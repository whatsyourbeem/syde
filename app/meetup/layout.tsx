import { Metadata } from "next";

export const metadata: Metadata = {
  title: "사이드프로젝트 밋업 및 커뮤니티 모임 | SYDE",
  description: "1인 기업, 인디메이커들의 커뮤니티 모임을 통해 인사이트를 나누고 함께 성장하세요.",
  alternates: {
    canonical: "/meetup",
  },
};

export default function MeetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
