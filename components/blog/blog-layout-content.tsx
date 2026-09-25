"use client";

import { usePathname } from "next/navigation";
import { Pencil } from "lucide-react";
import { ShowcaseSidebarButton } from "@/components/showcase/showcase-sidebar-button";
import { ShowcaseRightSidebar } from "@/components/showcase/right-sidebar";
import { LoginPromptCard } from "@/components/auth/login-prompt-card";
import { useAuth } from "@/context/AuthContext";

interface BlogLayoutContentProps {
  sydePick?: React.ReactNode;
  banner?: React.ReactNode;
  children: React.ReactNode;
}

export function BlogLayoutContent({
  sydePick,
  banner,
  children,
}: BlogLayoutContentProps) {
  const pathname = usePathname();
  const isMainPage = pathname === "/blog";
  const { user, profile, avatarUrl, isLoading } = useAuth();

  if (!isMainPage) {
    return <>{children}</>;
  }

  return (
    <div className="w-full">
      <div className="w-full bg-card border-b">
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <h1 className="text-2xl font-bold mb-2 text-foreground py-2">블로그</h1>
            <h2>만들면서 겪은 일, 배운 것, 삽질까지</h2>
          </div>
        </div>
      </div>

      <main className="flex justify-center gap-x-5 md:px-5 max-w-6xl mx-auto">
        <div className="hidden md:block w-1/5 sticky top-[70px] self-start h-screen">
          {isLoading ? null : user && profile ? (
            <ShowcaseSidebarButton
              userId={user.id}
              avatarUrl={avatarUrl}
              username={profile.username}
              full_name={profile.full_name}
              tagline={profile.tagline}
              certified={profile.certified}
              href="/blog/write"
              label="글쓰기"
              inline
              icon={<Pencil className="size-5" strokeWidth={2.5} />}
            />
          ) : (
            <LoginPromptCard />
          )}
        </div>

        <div className="w-full md:w-4/5 lg:w-3/5 border-x border-gray-200">{children}</div>

        <ShowcaseRightSidebar sydePick={sydePick} banner={banner} />
      </main>
    </div>
  );
}
