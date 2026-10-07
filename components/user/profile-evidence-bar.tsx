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
    // 앞 두 칸은 직접 만든 것, 뒤 두 칸은 다른 사람에게 얻은 반응
    { label: "블로그", value: stats.blogPostsCount },
    { label: "프로젝트", value: stats.showcasesCount },
    { label: "누적 조회수", value: stats.totalViews },
    { label: "받은 좋아요", value: stats.totalUpvotes },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 md:gap-3 mx-5 md:mx-8 mt-4 mb-2 px-2 py-4 md:p-5 bg-[#FAFAFA] rounded-xl">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-[20px] md:text-[22px] font-bold text-sydeblue">{formatCount(item.value)}</span>
          <span className="text-[11px] text-[#777777] whitespace-nowrap">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
