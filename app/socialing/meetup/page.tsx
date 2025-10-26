import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import MeetupStatusFilter from "@/components/meetup/meetup-status-filter";
import { Database, Enums } from "@/types/database.types";
import {
  MEETUP_CATEGORIES,
  MEETUP_LOCATION_TYPES,
  MEETUP_STATUSES,
  MEETUP_STATUS_DISPLAY_NAMES,
  MEETUP_LOCATION_TYPE_DISPLAY_NAMES,
  MEETUP_CATEGORY_DISPLAY_NAMES,
} from "@/lib/constants";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { Calendar, MapPin } from "lucide-react";
import { CertifiedBadge } from "@/components/ui/certified-badge";

type MeetupWithOrganizerProfile =
  Database["public"]["Tables"]["meetups"]["Row"] & {
    organizer_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
    clubs: Database["public"]["Tables"]["clubs"]["Row"] | null;
  };

// 날짜 포맷 헬퍼 함수 추가
function formatDate(dateString: string, includeYear: boolean = true) {
  // UTC로 저장된 시간을 한국시간(KST)으로 변환하여 표시
  const date = new Date(dateString);

  // 한국시간으로 변환 (UTC + 9시간)
  const kstDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );

  const year = kstDate.getFullYear().toString().slice(-2);
  const month = (kstDate.getMonth() + 1).toString().padStart(2, "0");
  const day = kstDate.getDate().toString().padStart(2, "0");

  // 한글 요일명
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[kstDate.getDay()];

  const hours24 = kstDate.getHours();
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  const period = hours24 < 12 ? "오전" : "오후";
  const minutes = kstDate.getMinutes().toString().padStart(2, "0");

  if (includeYear) {
    return `${year}.${month}.${day}(${weekday}) ${period} ${hours12}:${minutes}`;
  } else {
    return `${month}.${day}(${weekday}) ${period} ${hours12}:${minutes}`;
  }
}

function getCategoryBadgeClass(category: string) {
  switch (category) {
    case MEETUP_CATEGORIES.STUDY:
      return "border border-orange-500 bg-orange-50 text-orange-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm hover:bg-orange-50 hover:text-orange-700";
    case MEETUP_CATEGORIES.CHALLENGE:
      return "border border-red-500 bg-red-50 text-red-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm hover:bg-red-50 hover:text-red-700";
    case MEETUP_CATEGORIES.NETWORKING:
      return "border border-purple-500 bg-purple-50 text-purple-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm hover:bg-purple-50 hover:text-purple-700";
    case MEETUP_CATEGORIES.ETC:
      return "border border-gray-500 bg-gray-50 text-gray-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm hover:bg-gray-50 hover:text-gray-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm hover:bg-gray-50 hover:text-gray-700"; // 기본값
  }
}

function getLocationTypeBadgeClass(locationType: string) {
  switch (locationType) {
    case MEETUP_LOCATION_TYPES.ONLINE:
      return "border border-gray-500 bg-gray-50 text-gray-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm hover:bg-gray-50 hover:text-gray-700";
    case MEETUP_LOCATION_TYPES.OFFLINE:
      return "border border-gray-500 bg-gray-50 text-gray-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm hover:bg-gray-50 hover:text-gray-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm hover:bg-gray-50 hover:text-gray-700"; // 기본값
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case MEETUP_STATUSES.UPCOMING:
      return "border border-gray-400 bg-gray-100 text-gray-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm font-bold hover:bg-gray-100 hover:text-gray-700";
    case MEETUP_STATUSES.APPLY_AVAILABLE:
      return "border border-green-500 bg-green-50 text-green-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm font-bold hover:bg-green-50 hover:text-green-700";
    case MEETUP_STATUSES.APPLY_CLOSED:
      return "border border-red-500 bg-red-50 text-red-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm font-bold hover:bg-red-50 hover:text-red-700";
    case MEETUP_STATUSES.ENDED:
      return "border border-gray-500 bg-gray-50 text-gray-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm font-bold hover:bg-gray-50 hover:text-gray-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700 px-1 py-0.5 text-xs md:px-2 md:py-1 md:text-sm font-bold hover:bg-gray-50 hover:text-gray-700";
  }
}

export default async function MeetupPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tab?: string; page?: string }>;
}) {
  const supabase = await createClient();

  const awaitedSearchParams = await searchParams;
  const selectedStatus = awaitedSearchParams.status;
  const currentPage = parseInt(awaitedSearchParams.page || "1", 10);
  const pageSize = 12; // 그리드 레이아웃에 맞게 12개씩
  const offset = (currentPage - 1) * pageSize;

  // Fetch meetups with pagination
  let meetupQuery = supabase
    .from("meetups")
    .select(
      "*, clubs(id, name, thumbnail_url), organizer_profile:profiles!meetups_organizer_id_fkey(full_name, username, avatar_url, tagline, certified), thumbnail_url, category, location_type, status, start_datetime, end_datetime, location, address, max_participants"
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

  const { count: totalCount } = await countQuery;
  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  const typedMeetups = meetups as MeetupWithOrganizerProfile[];

  if (meetupsError) {
    console.error("Error fetching meetups:", meetupsError);
    return (
      <div className="container mx-auto p-4">
        모임 데이터를 불러오는 데 실패했습니다.
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <MeetupStatusFilter searchParams={awaitedSearchParams} />
      {meetups.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p>해당 모임이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {typedMeetups.map((meetup) => (
            <div
              key={meetup.id}
              className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col transition-all duration-200 ease-in-out hover:shadow-xl hover:scale-[1.01]"
            >
              <Link href={`/socialing/meetup/${meetup.id}`}>
                <div className="relative aspect-w-3 aspect-h-2">
                  <Image
                    src={
                      meetup.thumbnail_url || "/default_meetup_thumbnail.png"
                    }
                    alt={meetup.title}
                    fill
                    className={`object-cover object-center rounded-t-lg ${
                      meetup.status === MEETUP_STATUSES.ENDED ? "grayscale" : ""
                    }`}
                  />
                  {meetup.status === MEETUP_STATUSES.ENDED && (
                    <div className="absolute inset-0 bg-white opacity-50"></div>
                  )}
                  <div className="absolute top-3 inset-x-0 flex justify-between items-start px-3">
                    <Badge
                      className={`${getStatusBadgeClass(
                        meetup.status
                      )} whitespace-nowrap`}
                    >
                      {MEETUP_STATUS_DISPLAY_NAMES[meetup.status]}
                    </Badge>
                    <div className="hidden md:flex gap-2">
                      <Badge className={getCategoryBadgeClass(meetup.category)}>
                        {MEETUP_CATEGORY_DISPLAY_NAMES[meetup.category]}
                      </Badge>
                      <Badge
                        className={getLocationTypeBadgeClass(
                          meetup.location_type
                        )}
                      >
                        {
                          MEETUP_LOCATION_TYPE_DISPLAY_NAMES[
                            meetup.location_type
                          ]
                        }
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="p-2 md:px-6 md:pb-4 md:pt-4 flex-grow flex flex-col">
                <Link
                  href={`/socialing/meetup/${meetup.id}`}
                  className="justyfy-between mb-2"
                >
                  <div className="flex justify-between items-start">
                    <h2 className="text-sm md:text-base font-semibold line-clamp-2 hover:underline mr-2">
                      {meetup.title}
                    </h2>
                  </div>
                </Link>
                <div className="flex-grow"></div>
                {meetup.clubs && (
                  <Link
                    href={`/socialing/club/${meetup.clubs.id}`}
                    className="inline-flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold text-gray-700 hover:underline mb-2"
                  >
                    <div className="relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                      {meetup.clubs.thumbnail_url ? (
                        <Image
                          src={meetup.clubs.thumbnail_url}
                          alt={meetup.clubs.name || "Club thumbnail"}
                          fill
                          className="aspect-square size-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {meetup.clubs.name?.charAt(0) || "C"}
                        </span>
                      )}
                    </div>
                    <span className="truncate inline-block max-w-full">
                      {meetup.clubs.name}
                    </span>
                  </Link>
                )}

                {!meetup.clubs && meetup.organizer_profile && (
                  <ProfileHoverCard
                    userId={meetup.organizer_profile.id}
                    profileData={meetup.organizer_profile}
                  >
                    <div className="text-xs md:text-sm text-gray-500 flex items-center gap-1 md:gap-2 mb-2">
                      <Link href={`/${meetup.organizer_profile?.username}`}>
                        <Avatar className="size-5">
                          <AvatarImage
                            src={
                              meetup.organizer_profile?.avatar_url || undefined
                            }
                          />
                          <AvatarFallback>
                            {meetup.organizer_profile?.username?.charAt(0) ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <p className="flex items-center">
                        <Link
                          href={`/${meetup.organizer_profile?.username}`}
                          className="inline-flex items-center gap-1"
                        >
                          <span className="truncate inline-block max-w-full font-semibold text-gray-700 hover:underline">
                            {meetup.organizer_profile?.full_name ||
                              meetup.organizer_profile?.username ||
                              "알 수 없음"}
                          </span>
                          {meetup.organizer_profile?.certified && (
                            <CertifiedBadge size="sm" />
                          )}
                        </Link>
                        <span className="ml-1">모임장</span>
                      </p>
                    </div>
                  </ProfileHoverCard>
                )}
                <Link
                  href={`/socialing/meetup/${meetup.id}`}
                  className="text-sm text-gray-500"
                >
                  <p className="text-[11px] md:text-sm text-gray-500 font-normal md:font-medium flex items-center gap-2 md:mb-2">
                    {meetup.start_datetime && (
                      <>
                        <Calendar className="size-3 md:size-4" />
                        <span>{formatDate(meetup.start_datetime)}</span>
                      </>
                    )}
                  </p>
                  <p className="text-[11px] md:text-sm text-gray-500 font-normal md:font-medium flex items-center gap-2">
                    {meetup.location && (
                      <>
                        <MapPin className="size-3 md:size-4" />
                        <span className="truncate whitespace-nowrap overflow-hidden">
                          {meetup.location}
                          {meetup.address && ` (${meetup.address})`}
                        </span>
                      </>
                    )}
                  </p>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {currentPage > 1 && (
            <Link
              href={`/socialing/meetup?${new URLSearchParams({
                ...(selectedStatus && { status: selectedStatus }),
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
                href={`/socialing/meetup?${new URLSearchParams({
                  ...(selectedStatus && { status: selectedStatus }),
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
              href={`/socialing/meetup?${new URLSearchParams({
                ...(selectedStatus && { status: selectedStatus }),
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
}
