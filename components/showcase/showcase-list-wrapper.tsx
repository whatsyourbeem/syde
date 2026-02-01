"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ShowcaseList } from "@/components/showcase/showcase-list";
import { MainAwardBanner } from "@/components/showcase/main-award-banner";
import { DeleteSuccessDialog } from "@/components/showcase/delete-success-dialog";
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
  const router = useRouter();
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

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Main Content Area: Awards + List */}
      <div className="w-full flex flex-col gap-6">
        {/* Mobile: Register Project Button */}
        <div className="md:hidden w-full px-4 py-3 pb-0">
          <Link href="/showcase/create" className="block w-full">
            <div className="w-full h-[44px] bg-[#002040] rounded-[12px] flex items-center justify-center gap-2.5">
              <div className="flex gap-[2px]">
                <div className="w-[18px] h-[18px] relative border-[1.5px] border-white rounded-[1px] flex items-center justify-center">
                  <div className="absolute w-[8px] h-[1.5px] bg-white top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute w-[1.5px] h-[8px] bg-white top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <span className="font-pretendard font-semibold text-[16px] leading-[19px] text-white">
                내 SYDE 프로젝트 등록하기
              </span>
            </div>
          </Link>
        </div>

        {/* <MainAwardBanner /> */}
        <ShowcaseList
          currentUserId={user?.id || null}
          filterByUserId={filterByUserId}
          filterByCommentedUserId={filterByCommentedUserId}
          filterByLikedUserId={filterByLikedUserId}
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
