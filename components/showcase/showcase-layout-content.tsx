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
  const isCreatePage = pathname === "/showcase/create";

  return (
    <main className="flex justify-center gap-x-5 pb-3 md:px-5 md:pb-5 max-w-6xl mx-auto">
      {/* Left Sidebar: Create 페이지가 아닐 때만 표시 */}
      {!isCreatePage && (
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
          isCreatePage
            ? "w-full lg:w-4/5 border-x border-gray-200" // Create 페이지: 왼쪽 공간만큼 확장 (1/5 제거 -> 4/5 사용)
            : "w-full md:w-4/5 lg:w-3/5 border-x border-gray-200" // 기본: 중앙 3/5
        }
      >
        {children}
      </div>

      {/* Right Sidebar: 항상 표시 (사용자 요청) */}
      <ShowcaseRightSidebar />
    </main>
  );
}
