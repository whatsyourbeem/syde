import Link from "next/link";

interface ProfileDevelopingBadgeProps {
  showcase: {
    id: string;
    name: string | null;
    slug: string | null;
  };
  className?: string;
}

export function ProfileDevelopingBadge({ showcase, className }: ProfileDevelopingBadgeProps) {
  return (
    <Link
      href={`/showcase/${showcase.slug || showcase.id}`}
      prefetch={false}
      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF3C7] rounded-full text-[12px] font-bold text-[#92400E] hover:bg-[#FDE68A] transition-colors ${className || ""}`}
    >
      <span>🟡</span>
      <span>지금 만드는 중 — {showcase.name || "제목 없음"}</span>
    </Link>
  );
}
