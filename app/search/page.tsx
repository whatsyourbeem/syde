import { createClient } from "@/lib/supabase/server";
import { SearchForm } from "@/components/search/search-form";
import { CategoryTab } from "@/components/search/category-tab";
import { RecentSearch } from "@/components/search/recent-search";
import { EmptyState } from "@/components/search/empty-state";
import { LogListWrapper } from "@/components/log/log-list-wrapper";
import { UserList } from "@/components/user/user-list";
import { ClubSearchList } from "@/components/club/club-search-list";
import { MeetupSearchList } from "@/components/meetup/meetup-search-list";
import { InsightSearchList } from "@/components/insight/insight-search-list";
import { ShowcaseSearchList } from "@/components/showcase/showcase-search-list";
import { AllSearchResults } from "@/components/search/all-search-results";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; tab?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q || "";
  const currentTab = resolvedSearchParams.tab || "all";

  let profile = null;
  let avatarUrl = null;
  if (user) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*, updated_at")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile for SearchPage:", profileError);
    } else if (data) {
      profile = data;
      avatarUrl =
        profile.avatar_url && profile.updated_at
          ? `${profile.avatar_url}?t=${new Date(
              profile.updated_at
            ).getTime()}`
          : profile.avatar_url;
    }
  }

  const renderContent = () => {
    if (!q) {
      return (
        <>
          <RecentSearch />
          <EmptyState />
        </>
      );
    }

    switch (currentTab) {
      case "all":
        return <AllSearchResults searchQuery={q} />;
      case "logs":
        return <LogListWrapper user={profile} avatarUrl={avatarUrl} />;
      case "users":
        return <UserList searchQuery={q} />;
      case "clubs":
        return <ClubSearchList searchQuery={q} />;
      case "meetups":
        return <MeetupSearchList searchQuery={q} />;
      case "insights":
        return <InsightSearchList searchQuery={q} />;
      case "showcase":
        return <ShowcaseSearchList searchQuery={q} />;
      default:
        return <LogListWrapper user={profile} avatarUrl={avatarUrl} />;
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center bg-white">
      {/* Search Title + Input */}
      <div className="w-full max-w-[720px] mx-auto pt-4 pb-4">
        <SearchForm />
      </div>

      {/* Category Toggles */}
      <div className="w-full flex justify-center bg-white">
        <CategoryTab />
      </div>

      {/* Content Area */}
      <div className="w-full max-w-[720px] mx-auto py-6 px-4">
        {renderContent()}
      </div>
    </main>
  );
}
