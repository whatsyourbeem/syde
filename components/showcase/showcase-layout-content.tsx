"use client";

import { usePathname } from "next/navigation";
import { ShowcaseSidebarButton } from "@/components/showcase/showcase-sidebar-button";
import { ShowcaseHeader } from "@/components/showcase/showcase-header";
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
  const isMainPage = pathname === "/showcase";

  return (
    <div className="w-full">
      {/* Header: 메인 페이지에서만 별도의 전체 너비 영역으로 표시 */}
      {isMainPage && <ShowcaseHeader />}

      <main className="flex justify-center gap-x-5 md:px-5 max-w-6xl mx-auto">
        {/* Left Sidebar: 메인 페이지에서만 표시 */}
        {isMainPage && (
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
            !isMainPage
              ? "w-full max-w-6xl mx-auto border-x border-gray-200 bg-white" // 1-단 구조 (Detail, Create, Edit 등)
              : "w-full md:w-4/5 lg:w-3/5 border-x border-gray-200" // 3-단 구조 (Main Feed)
          }
        >
          {children}
        </div>

        {/* Right Sidebar: 메인 페이지에서만 표시 */}
        {isMainPage && <ShowcaseRightSidebar />}
      </main>
    </div>
  );
}
