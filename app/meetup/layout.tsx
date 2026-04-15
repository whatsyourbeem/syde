import { Metadata } from "next";

export const metadata: Metadata = {
  title: "모임 | SYDE",
  description: "사이드프로젝트 밋업 및 커뮤니티 네트워킹 모임",
  alternates: {
    canonical: "/meetup",
  },
};

export default function MeetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
