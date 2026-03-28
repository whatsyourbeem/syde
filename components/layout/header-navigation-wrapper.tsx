"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function HeaderNavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 프로필 페이지 여부 판단 (/[username] 형태이며 정적 루트가 아닌 경우)
  const segments = pathname.split("/").filter(Boolean);
  const staticRoutes = [
    "log", "insight", "meetup", "club", "search", 
    "profile", "auth", "guideline", "term", 
    "privacy", "about", "gathering", "showcase"
  ];
  
  const isProfilePage = 
    segments.length === 1 && 
    !staticRoutes.includes(segments[0]);

  return (
    <div className={cn(
      "w-full bg-background sticky top-0 z-40",
      isProfilePage ? "hidden md:block" : "block"
    )}>
      <nav className="md:h-auto w-full max-w-6xl mx-auto flex justify-center items-center px-5">
        {children}
      </nav>
      <Separator />
    </div>
  );
}
