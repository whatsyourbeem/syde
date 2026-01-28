"use client";

import { usePathname } from "next/navigation";
import { ShowcaseSidebarButton } from "@/components/showcase/showcase-sidebar-button";
import { ShowcaseRightSidebar } from "@/components/showcase/right-sidebar";
import { LoginPromptCard } from "@/components/auth/login-prompt-card";
import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ShowcaseLayoutContentProps {
  user: any;
  profile: Profile | null;
  avatarUrl: string | null;
  children: React.ReactNode;
}

export function ShowcaseLayoutContent({
  user,
  profile,
  avatarUrl,
  children,
}: ShowcaseLayoutContentProps) {
  const pathname = usePathname();
  // Left Sidebar는 /showcase 메인 페이지에서만 표시
  const showLeftSidebar = pathname === "/showcase";

  return (
    <main className="flex justify-center gap-x-5 md:px-5 max-w-6xl mx-auto">
      {/* Left Sidebar: 메인 페이지에서만 표시 */}
      {showLeftSidebar && (
        <div className="hidden md:block w-1/5 sticky top-[70px] self-start h-screen">
          {user && profile ? (
            <ShowcaseSidebarButton
              userId={user.id}
              avatarUrl={avatarUrl}
              username={profile.username}
              full_name={profile.full_name}
              tagline={profile.tagline}
              certified={profile.certified}
            />
          ) : (
            <LoginPromptCard />
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={
          !showLeftSidebar
            ? "w-full lg:w-4/5 border-x border-gray-200" // 사이드바가 없을 때 (Create, Detail 등): 확장 (4/5)
            : "w-full md:w-4/5 lg:w-3/5 border-x border-gray-200" // 기본 (Main): 중앙 3/5
        }
      >
        {children}
      </div>

      {/* Right Sidebar: 항상 표시 (사용자 요청) */}
      <ShowcaseRightSidebar />
    </main>
  );
}
