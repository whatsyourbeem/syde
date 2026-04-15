import { Metadata } from "next";

export const metadata: Metadata = {
  title: "사이드프로젝트 & 1인 창업 인사이트: 기획부터 수익화까지 | SYDE",
  description: "혼자서도 성공적인 IT 프로덕트를 만들 수 있습니다. 기획, 마케팅, 수익화 전략 등 비즈니스 노하우부터 최신 바이브코딩과 디자인 실무 팁까지, 인디 메이커의 성장을 돕는 모든 실전 인사이트를 확인하세요.",
  alternates: {
    canonical: "/insight",
  },
};

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
