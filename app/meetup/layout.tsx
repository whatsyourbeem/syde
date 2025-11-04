"use client";

import SocialingTabs from "@/components/socialing/socialing-tabs";

export default function MeetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="w-full bg-card border-b">
        <div className="w-full mx-auto px-4 py-8">
          <SocialingTabs />
          <div className="text-center text-muted-foreground mt-4">
            <h2 className="text-2xl font-bold mb-2 text-foreground py-2">
              Meetups
            </h2>
            <p>다양한 주제의 모임을 탐색하고 참여해보세요.</p>
          </div>
        </div>
      </div>
      <div className="mx-auto">{children}</div>
    </div>
  );
}
