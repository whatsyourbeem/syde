"use client";

import { usePathname } from "next/navigation";
import SocialingTabs from "@/components/socialing/socialing-tabs";

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
        <div className={"w-full pt-8"}>
          <div className="w-full mx-auto px-4 border-b pb-8">
            <SocialingTabs />
            <div className="text-center text-muted-foreground mt-4">
              {pathname === "/socialing/meetup" && (
                <>
                  <h2 className="text-2xl font-bold mb-2 text-foreground py-2">
                    Meetups
                  </h2>
                  <p>다양한 주제의 모임을 탐색하고 참여해보세요.</p>
                </>
              )}
              {pathname === "/socialing/club" && (
                <>
                  <h2 className="text-2xl font-bold mb-2 text-foreground py-2">
                    Clubs
                  </h2>
                  <p>함께 모여 성장하는 SYDE 클럽</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto">{children}</div>
    </div>
  );
}
