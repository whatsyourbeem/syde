"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CirclePlus } from "lucide-react";
import { ShowcaseList } from "@/components/showcase/showcase-list";
import { TrendingShowcases } from "@/components/showcase/trending-showcases";
import { DeleteSuccessDialog } from "@/components/showcase/delete-success-dialog";
import { Database } from "@/types/database.types";
import { OptimizedShowcase, ShowcaseQueryResult } from "@/lib/queries/showcase-queries";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { LatestAwardCard } from "@/components/showcase/latest-award-card";
import { ShowcaseStatusFilter } from "@/components/showcase/showcase-status-filter";
import type { ShowcaseStatus } from "@/lib/constants";

interface ShowcaseListWrapperProps {
  user: Database["public"]["Tables"]["profiles"]["Row"] | null;
  avatarUrl: string | null;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByUpvotedUserId?: string;
  searchQuery?: string;
  initialShowcases?: ShowcaseQueryResult;
  latestAwardedShowcase?: OptimizedShowcase | null;
  status?: ShowcaseStatus;
}

export function ShowcaseListWrapper({
  user,
  avatarUrl,
  filterByUserId,
  filterByCommentedUserId,
  filterByUpvotedUserId,
  initialShowcases,
  latestAwardedShowcase,
  status,
}: ShowcaseListWrapperProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openLoginDialog } = useLoginDialog();
  const searchQuery = searchParams.get("q") || "";
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("deleted") === "true") {
      setShowDeleteSuccess(true);
      const timer = setTimeout(() => {
        setShowDeleteSuccess(false);
        router.replace("/showcase");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  // Determine if we should show the latest award card
  // Show only on main list without active filters/search
  const showLatestAward = latestAwardedShowcase && !searchQuery && !status && !filterByUserId && !filterByCommentedUserId && !filterByUpvotedUserId;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Main Content Area: Awards + List */}
      <div className="w-full flex flex-col gap-0">
        {/* Mobile: Trending & Register Button */}
        <div className="lg:hidden flex flex-col gap-0">
          <div>
            <TrendingShowcases allowCollapse={true} />
          </div>

          <div className="w-full px-4 pt-3 pb-1">
            <button
              onClick={() => {
                if (!user) {
                  openLoginDialog();
                } else {
                  router.push("/showcase/create");
                }
              }}
              className="block w-full"
            >
              <div className="w-full h-[44px] bg-sydeblue rounded-[12px] flex items-center justify-center gap-2.5">
                <CirclePlus className="text-white size-5" strokeWidth={2} />
                <span className="font-pretendard font-semibold text-[14px] leading-[17px] text-white">
                  내 프로젝트 등록하기
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Latest SYDE Pick Award Section */}
        {showLatestAward && (
          <LatestAwardCard
            showcase={latestAwardedShowcase}
            currentUserId={user?.id || null}
          />
        )}

        {/* Status Filter (진행 상태) */}
        <div className="w-full flex justify-end px-4 pt-3 pb-1">
          <ShowcaseStatusFilter />
        </div>

        {/* <MainAwardBanner /> */}
        <ShowcaseList
          currentUserId={user?.id || null}
          status={status}
          filterByUserId={filterByUserId}
          filterByCommentedUserId={filterByCommentedUserId}
          filterByUpvotedUserId={filterByUpvotedUserId}
          searchQuery={searchQuery}
          initialShowcases={initialShowcases}
        />
      </div>
      <DeleteSuccessDialog
        open={showDeleteSuccess}
        onOpenChange={setShowDeleteSuccess}
      />
    </div>
  );
}
