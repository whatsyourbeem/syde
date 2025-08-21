"use client";

import { usePathname } from "next/navigation";
import SocialingTabs from "@/components/socialing/socialing-tabs";
import { cn } from "@/lib/utils";

export default function SocialingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const shouldShowTabs =
    pathname === "/socialing/meetup" || pathname === "/socialing/club";

  return (
    <div className="w-full">
      {shouldShowTabs && (
        <div className={cn(
          "w-full py-8",
          pathname === "/socialing/meetup" ? "bg-blue-50" : "",
          pathname === "/socialing/club" ? "bg-green-50" : ""
        )}>
          <div className="w-full max-w-4xl mx-auto px-4">
            <SocialingTabs />
            <div className="text-center text-muted-foreground mt-4 mb-8">
              {pathname === "/socialing/meetup" && (
                <>
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Meetups</h2>
                  <p>다양한 주제의 모임을 탐색하고 참여해보세요.</p>
                </>
              )}
              {pathname === "/socialing/club" && (
                <>
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Clubs</h2>
                  <p>관심사에 맞는 클럽을 찾거나 직접 만들어 활동해보세요.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 mt-6">{children}</div>
    </div>
  );
}
