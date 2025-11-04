"use client";

import SocialingTabs from "@/components/socialing/socialing-tabs";

export default function ClubLayout({
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
              Clubs
            </h2>
            <p>함께 모여 성장하는 SYDE 클럽</p>
          </div>
        </div>
      </div>
      <div className="mx-auto">{children}</div>
    </div>
  );
}
