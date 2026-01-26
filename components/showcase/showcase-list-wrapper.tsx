"use client";

import { useSearchParams } from "next/navigation";
import { ShowcaseList } from "@/components/showcase/showcase-list";
import { MainAwardBanner } from "@/components/showcase/main-award-banner";
import { Database } from "@/types/database.types";
import { ShowcaseQueryResult } from "@/lib/queries/showcase-queries";

interface ShowcaseListWrapperProps {
  user: Database["public"]["Tables"]["profiles"]["Row"] | null;
  avatarUrl: string | null;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  searchQuery?: string;
  initialShowcases?: ShowcaseQueryResult;
}

export function ShowcaseListWrapper({
  user,
  avatarUrl,
  filterByUserId,
  filterByCommentedUserId,
  filterByLikedUserId,
  initialShowcases,
}: ShowcaseListWrapperProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Main Content Area: Awards + List */}
      <div className="w-full flex flex-col gap-6">
        <MainAwardBanner />
        <ShowcaseList
          currentUserId={user?.id || null}
          filterByUserId={filterByUserId}
          filterByCommentedUserId={filterByCommentedUserId}
          filterByLikedUserId={filterByLikedUserId}
          searchQuery={searchQuery}
          initialShowcases={initialShowcases}
        />
      </div>
    </div>
  );
}
