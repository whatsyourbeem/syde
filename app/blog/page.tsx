import React from "react";
import { createClient } from "@/lib/supabase/server";
import { InsightFeed } from "@/components/insight/insight-feed";
import { fetchInsightsAction } from "@/app/blog/insight-data-actions";
const ITEMS_PER_PAGE = 18;

export default async function InsightPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("avatar_url, full_name, username").eq("id", user.id).single()
    : { data: null };

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
              블로그
            </h1>
            <h2>만들면서 겪은 일, 배운 것, 삽질까지</h2>
          </div>
        </div>
      </div>

      {/* Main Content (Client Component Feed) */}
      <InsightFeed
        initialInsights={initialInsights}
        currentUserId={user?.id || null}
        currentUser={profile ? { name: profile.full_name || profile.username || "", avatarUrl: profile.avatar_url } : null}
      />
    </div>
  );
}
