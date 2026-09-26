import { ProfileStats } from "@/lib/queries/profile-stats-queries";

interface ProfileEvidenceBarProps {
  stats: ProfileStats;
}

function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${value}`;
}

export function ProfileEvidenceBar({ stats }: ProfileEvidenceBarProps) {
  const items = [
    { label: "만든 프로젝트", value: stats.showcasesCount },
    { label: "누적 좋아요", value: stats.totalUpvotes },
    { label: "참석 모임", value: stats.meetupsAttendedCount },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mx-5 md:mx-8 mt-4 mb-2 p-4 md:p-5 bg-[#FAFAFA] rounded-xl">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-[20px] md:text-[22px] font-bold text-sydeblue">{formatCount(item.value)}</span>
          <span className="text-[11px] text-[#777777]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
