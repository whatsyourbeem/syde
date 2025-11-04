"use client";

import MeetupTypeTabs from "@/components/meetup/meetup-type-tabs";

export default function MeetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="w-full bg-card border-b">
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <h2 className="text-2xl font-bold mb-2 text-foreground py-2">
              Meetups
            </h2>
            <p>다양한 주제의 모임을 탐색하고 참여해보세요.</p>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto">
        <MeetupTypeTabs className="py-5" />
        {children}
      </div>
    </div>
  );
}
