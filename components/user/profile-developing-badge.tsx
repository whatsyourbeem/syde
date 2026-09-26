import Link from "next/link";
import { DOT_COLORS } from "@/components/showcase/showcase-status-overlay";

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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAFAFA] border border-[#B7B7B7] rounded-full text-[11px] font-medium text-[#777777] hover:bg-[#F1F1F1] transition-colors ${className || ""}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: DOT_COLORS.DEVELOPING }}
      />
      <span>지금 만드는 중 — {showcase.name || "제목 없음"}</span>
    </Link>
  );
}
