import React from "react";
import { createClient } from "@/lib/supabase/server";
import { InsightFeed } from "@/components/insight/insight-feed";
import { fetchInsightsAction } from "@/app/insight/insight-data-actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insights - SYDE 인사이트",
  description: "사이드프로젝트 기획·개발·수익화 노하우를 확인하세요.",
  openGraph: {
    title: "Insights - SYDE 인사이트",
    description: "사이드프로젝트 기획·개발·수익화 노하우를 확인하세요.",
    images: ["/we-are-syders.png"],
  },
};

const ITEMS_PER_PAGE = 18;

export default async function InsightPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const initialInsights = await fetchInsightsAction({
    currentPage: 1,
    itemsPerPage: ITEMS_PER_PAGE,
    currentUserId: user?.id || null,
  });

  return (
    <div className="min-h-screen bg-background pb-20 relative flex flex-col h-full overflow-y-scroll custom-scrollbar">
      {/* Unified Title Section */}
      <div className="w-full bg-card border-b">
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <h1 className="text-2xl font-bold mb-2 text-foreground py-2">
              Insights
            </h1>
            <h2>사이드프로젝트 기획·개발·수익화 노하우</h2>
          </div>
        </div>
      </div>

      {/* Main Content (Client Component Feed) */}
      <InsightFeed initialInsights={initialInsights} currentUserId={user?.id || null} />
    </div>
  );
}
