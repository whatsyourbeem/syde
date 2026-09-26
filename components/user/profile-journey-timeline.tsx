"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Rocket, Hammer, Archive, PenLine, type LucideIcon } from "lucide-react";
import { fetchProfileTimelineAction } from "@/app/[username]/timeline-actions";
import { ProfileTimelineItem } from "@/lib/queries/profile-timeline-queries";
import { SHOWCASE_STATUS_DISPLAY_NAMES } from "@/lib/constants";
import { DOT_COLORS } from "@/components/showcase/showcase-status-overlay";
import { SectionHeader } from "@/components/user/section-header";

interface ProfileJourneyTimelineProps {
  userId: string;
}

const PAGE_SIZE = 10;

const STATUS_ICON: Record<string, LucideIcon> = {
  IN_SERVICE: Rocket,
  DEVELOPING: Hammer,
  ENDED: Archive,
};

const BLOG_ACCENT_COLOR = "#ED6D34"; // sydeorange

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function TimelineNode({ color, Icon }: { color: string; Icon: LucideIcon }) {
  return (
    <span
      className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
      style={{ backgroundColor: `${color}1A` }}
    >
      <Icon size={14} style={{ color }} strokeWidth={2} />
    </span>
  );
}

function TimelineRow({ item }: { item: ProfileTimelineItem }) {
  if (item.type === "showcase") {
    const color = DOT_COLORS[item.status];
    return (
      <Link
        href={`/showcase/${item.slug || item.id}`}
        prefetch={false}
        className="flex items-center gap-3 py-3 hover:bg-[#FAFAFA] rounded-lg px-2 -mx-2 transition-colors"
      >
        <TimelineNode color={color} Icon={STATUS_ICON[item.status]} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[11px] text-[#777777]">
            {formatDate(item.date)} · {SHOWCASE_STATUS_DISPLAY_NAMES[item.status]}
          </span>
          <span className="text-sm font-bold text-black line-clamp-1">{item.name}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${item.slug || item.id}`}
      prefetch={false}
      className="flex items-center gap-3 py-3 hover:bg-[#FAFAFA] rounded-lg px-2 -mx-2 transition-colors"
    >
      <TimelineNode color={BLOG_ACCENT_COLOR} Icon={PenLine} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] text-[#777777]">{formatDate(item.date)} · 쓴 글</span>
        <span className="text-sm font-bold text-black line-clamp-1">{item.title}</span>
      </div>
    </Link>
  );
}

export function ProfileJourneyTimeline({ userId }: ProfileJourneyTimelineProps) {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data, isLoading } = useQuery({
    queryKey: ["profile-journey-timeline", userId, limit],
    queryFn: () => fetchProfileTimelineAction(userId, limit),
    staleTime: 30000,
  });

  const items = data?.items || [];

  return (
    <div className="px-5 py-4 md:px-8 md:py-6">
      <SectionHeader title="만들어온 여정" />

      {isLoading && (
        <p className="text-sm text-[#777777] py-4 text-center">불러오는 중...</p>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex items-center justify-center h-[81px] text-center px-4 bg-[#FAFAFA] rounded-xl">
          <p className="text-[#777777] text-sm font-light leading-[150%]">
            아직 기록된 시도가 없어요. 첫 시도를 시작해보세요.
          </p>
        </div>
      )}

      <div className="flex flex-col divide-y divide-[#F1F1F1]">
        {items.map((item) => (
          <TimelineRow key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>

      {data?.hasMore && (
        <button
          onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
          className="w-full mt-3 py-2 text-sm font-bold text-[#777777] hover:text-sydeblue bg-[#FAFAFA] rounded-xl transition-colors"
        >
          이전 기록 더보기
        </button>
      )}
    </div>
  );
}
