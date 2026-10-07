"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export type ProfileTab = "blog" | "about";

interface ProfileTabsProps {
  initialTab: ProfileTab;
  blogPostsCount: number;
  aboutPanel: ReactNode;
  blogPanel: ReactNode;
}

/**
 * 프로필 콘텐츠 전환용 작은 밑줄 탭.
 * 두 탭의 내용을 서버에서 함께 렌더링해 두고 클라이언트에서 표시만 전환한다.
 * ?tab= 은 history.replaceState로만 갱신하므로 서버 재렌더링(loading.tsx 스켈레톤 깜빡임)이 없다.
 */
export function ProfileTabs({ initialTab, blogPostsCount, aboutPanel, blogPanel }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  const tabs: { id: ProfileTab; label: string; count?: number }[] = [
    { id: "about", label: "소개" },
    { id: "blog", label: "블로그", count: blogPostsCount },
  ];

  const selectTab = (tab: ProfileTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    window.history.replaceState(null, "", `${window.location.pathname}?tab=${tab}`);
  };

  return (
    <>
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
              aria-controls={`profile-tabpanel-${tab.id}`}
              onClick={() => selectTab(tab.id)}
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
      <div
        id="profile-tabpanel-about"
        role="tabpanel"
        aria-labelledby="profile-tab-about"
        hidden={activeTab !== "about"}
      >
        {aboutPanel}
      </div>
      <div
        id="profile-tabpanel-blog"
        role="tabpanel"
        aria-labelledby="profile-tab-blog"
        hidden={activeTab !== "blog"}
      >
        {blogPanel}
      </div>
    </>
  );
}
