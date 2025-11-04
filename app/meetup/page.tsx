import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MeetupStatusFilter from "@/components/meetup/meetup-status-filter";
import { Enums } from "@/types/database.types";
import {
  MEETUP_STATUS_DISPLAY_NAMES,
} from "@/lib/constants";
import MeetupCard from "@/components/meetup/meetup-card";
import MeetupTypeTabs from "@/components/meetup/meetup-type-tabs";

export default async function MeetupPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}) {
  const supabase = await createClient();

  const awaitedSearchParams = await searchParams;
  const selectedStatus = awaitedSearchParams.status;
  const selectedType = awaitedSearchParams.type;
  const currentPage = parseInt(awaitedSearchParams.page || "1", 10);
  const pageSize = 12; // 그리드 레이아웃에 맞게 12개씩
  const offset = (currentPage - 1) * pageSize;

  // Fetch meetups with pagination
  let meetupQuery = supabase
    .from("meetups")
    .select(
      "*, clubs(id, name, thumbnail_url, created_at, description, owner_id, tagline, updated_at), organizer_profile:profiles!meetups_organizer_id_fkey(id, full_name, username, avatar_url, tagline, certified, bio, link, updated_at), thumbnail_url, category, location_type, status, start_datetime, end_datetime, location, address, max_participants"
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (selectedStatus && selectedStatus !== "전체") {
    const meetupStatus = Object.entries(MEETUP_STATUS_DISPLAY_NAMES).find(
      (entry) => entry[1] === selectedStatus
    )?.[0] as Enums<"meetup_status_enum"> | undefined;

    if (meetupStatus) {
      meetupQuery = meetupQuery.eq("status", meetupStatus);
    }
  }

  if (selectedType && selectedType !== "전체") {
    const meetupType = selectedType === "정기모임" ? "INSYDE" : "SPINOFF";
    meetupQuery = meetupQuery.eq("type", meetupType);
  }

  const { data: meetups, error: meetupsError } = await meetupQuery;

  // Get total count for pagination
  let countQuery = supabase
    .from("meetups")
    .select("*", { count: "exact", head: true });

  if (selectedStatus && selectedStatus !== "전체") {
    const meetupStatus = Object.entries(MEETUP_STATUS_DISPLAY_NAMES).find(
      (entry) => entry[1] === selectedStatus
    )?.[0] as Enums<"meetup_status_enum"> | undefined;

    if (meetupStatus) {
      countQuery = countQuery.eq("status", meetupStatus);
    }
  }

  if (selectedType && selectedType !== "전체") {
    const meetupType = selectedType === "정기모임" ? "INSYDE" : "SPINOFF";
    countQuery = countQuery.eq("type", meetupType);
  }

  const { count: totalCount } = await countQuery;
  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  if (meetupsError) {
    console.error("Error fetching meetups:", meetupsError);
    return (
      <div className="container mx-auto p-4">
        모임 데이터를 불러오는 데 실패했습니다.
      </div>
    );
  }

  const pageContent = (
    <div className="w-full">
      <div className="flex justify-end px-4">
        <MeetupStatusFilter searchParams={awaitedSearchParams} />
      </div>
      {meetups.length === 0 ? (
        <div className="text-center text-gray-500 mt-10 px-4">
          <p>해당 모임이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 p-4">
          {meetups.map((meetup) => (
            <MeetupCard key={meetup.id} meetup={meetup} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {currentPage > 1 && (
            <Link
              href={`/meetup?${new URLSearchParams({
                ...(selectedStatus && { status: selectedStatus }),
                ...(selectedType && { type: selectedType }),
                page: (currentPage - 1).toString(),
              }).toString()}`}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              이전
            </Link>
          )}

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Link
                key={pageNum}
                href={`/meetup?${new URLSearchParams({
                  ...(selectedStatus && { status: selectedStatus }),
                  ...(selectedType && { type: selectedType }),
                  page: pageNum.toString(),
                }).toString()}`}
                className={`px-3 py-2 text-sm font-medium border rounded-md ${
                  pageNum === currentPage
                    ? "bg-blue-600 text-white border-blue-600"
                    : "text-gray-500 hover:text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </Link>
            );
          })}

          {currentPage < totalPages && (
            <Link
              href={`/meetup?${new URLSearchParams({
                ...(selectedStatus && { status: selectedStatus }),
                ...(selectedType && { type: selectedType }),
                page: (currentPage + 1).toString(),
              }).toString()}`}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
  
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
        {pageContent}
      </div>
    </div>
  );
}