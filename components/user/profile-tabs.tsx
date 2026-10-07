"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export type ProfileTab = "blog" | "about";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  blogPostsCount: number;
}

/** 프로필 콘텐츠 전환용 작은 밑줄 탭. 전체 리로드 없이 ?tab= 만 교체한다. */
export function ProfileTabs({ activeTab, blogPostsCount }: ProfileTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const tabs: { id: ProfileTab; label: string; count?: number }[] = [
    { id: "about", label: "소개" },
    { id: "blog", label: "블로그", count: blogPostsCount },
  ];

  return (
    <div
      role="tablist"
      aria-label="프로필 콘텐츠"
      className="flex items-center gap-1 mx-5 md:mx-8 border-b border-[#EEEEEE]"
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`profile-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls="profile-tabpanel"
            onClick={() => {
              if (!selected) router.replace(`${pathname}?tab=${tab.id}`, { scroll: false });
            }}
            className={cn(
              "-mb-px min-w-[88px] px-5 py-3 text-sm text-center border-b-2 transition-colors",
              selected
                ? "font-bold text-sydeblue border-sydeorange"
                : "text-[#777777] border-transparent hover:text-sydeblue"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-xs font-normal text-[#999999]">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
