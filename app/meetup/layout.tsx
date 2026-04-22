import { Metadata } from "next";

export const metadata: Metadata = {
  title: "모임 | SYDE - 사이드프로젝트 커뮤니티 플랫폼",
  description: "SYDE 사이드프로젝트 정기모임. 1인개발자·솔로프리너들과 오프라인으로 만나 프로젝트 이야기를 나눠요.",
  alternates: {
    canonical: "/meetup",
  },
};

export default function MeetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
