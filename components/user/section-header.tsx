import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  children?: ReactNode;
}

/** 프로필 명함의 모든 섹션이 공유하는 제목 스타일 — 기존 프로필 탭에서 쓰던 패턴을 그대로 재사용. */
export function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-sydeorange font-bold">—</span>
        <span className="font-bold text-base text-black">{title}</span>
      </div>
      {children}
    </div>
  );
}
