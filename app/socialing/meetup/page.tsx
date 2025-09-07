import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Network } from "lucide-react";
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

type MeetupWithOrganizerProfile =
  Database["public"]["Tables"]["meetups"]["Row"] & {
    organizer_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
    clubs: Database["public"]["Tables"]["clubs"]["Row"] | null;
  };

// 날짜 포맷 헬퍼 함수 추가
function formatDate(dateString: string, includeYear: boolean = true) {
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });

  if (includeYear) {
    return `${year}.${month}.${day}(${weekday})`;
  } else {
    return `${month}.${day}(${weekday})`;
  }
}

function getCategoryBadgeClass(category: string) {
  switch (category) {
    case MEETUP_CATEGORIES.STUDY:
      return "border border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-50 hover:text-orange-700";
    case MEETUP_CATEGORIES.CHALLENGE:
      return "border border-red-500 bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700";
    case MEETUP_CATEGORIES.NETWORKING:
      return "border border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-50 hover:text-purple-700";
    case MEETUP_CATEGORIES.ETC:
      return "border border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700"; // 기본값
  }
}

function getLocationTypeBadgeClass(locationType: string) {
  switch (locationType) {
    case MEETUP_LOCATION_TYPES.ONLINE:
      return "border border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700";
    case MEETUP_LOCATION_TYPES.OFFLINE:
      return "border border-green-500 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700"; // 기본값
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case MEETUP_STATUSES.UPCOMING:
      return "border border-gray-400 bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700";
    case MEETUP_STATUSES.APPLY_AVAILABLE:
      return "border border-green-500 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700";
    case MEETUP_STATUSES.APPLY_CLOSED:
      return "border border-red-500 bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700";
    case MEETUP_STATUSES.ENDED:
      return "border border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700";
  }
}

export default async function MeetupPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tab?: string }>;
}) {
  const supabase = await createClient();

  const awaitedSearchParams = await searchParams;
  const selectedStatus = awaitedSearchParams.status;

  // Fetch meetups
  let meetupQuery = supabase
    .from("meetups")
    .select(
      "*, clubs(id, name), organizer_profile:profiles!meetups_organizer_id_fkey(full_name, username, avatar_url, tagline), thumbnail_url, category, location_type, status, start_datetime, end_datetime, location_description, max_participants"
    )
    .order("created_at", { ascending: false });

  if (selectedStatus && selectedStatus !== "전체") {
    const meetupStatus = Object.entries(MEETUP_STATUS_DISPLAY_NAMES).find(
      (entry) => entry[1] === selectedStatus
    )?.[0] as Enums<"meetup_status_enum"> | undefined;

    if (meetupStatus) {
      meetupQuery = meetupQuery.eq("status", meetupStatus);
    }
  }

  const { data: meetups, error: meetupsError } = await meetupQuery;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      meetup.status === MEETUP_STATUSES.ENDED
                        ? "grayscale opacity-50"
                        : ""
                    }`}
                  />
                  <div className="mt-3 px-3 flex justify-between h-fit">
                    <Badge className={getStatusBadgeClass(meetup.status)}>
                      {MEETUP_STATUS_DISPLAY_NAMES[meetup.status]}
                    </Badge>
                    <Badge
                      className={getLocationTypeBadgeClass(meetup.location_type)}
                    >
                      {MEETUP_LOCATION_TYPE_DISPLAY_NAMES[meetup.location_type]}
                    </Badge>
                  </div>
                </div>
              </Link>
              <div className="px-6 py-4 flex-grow flex flex-col">
                <Link href={`/socialing/meetup/${meetup.id}`} className="justyfy-between mb-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-base font-semibold line-clamp-3 hover:underline">
                      {meetup.title}
                    </h2>
                    <Badge className={getCategoryBadgeClass(meetup.category)}>
                      {MEETUP_CATEGORY_DISPLAY_NAMES[meetup.category]}
                    </Badge>
                  </div>
                </Link>
                {meetup.clubs && (
                  <Link
                    href={`/socialing/club/${meetup.clubs.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:underline mb-2"
                  >
                    <Network className="size-4" />
                    <span>{meetup.clubs.name}</span>
                  </Link>
                )}
                
                {meetup.organizer_profile && (
                  <ProfileHoverCard
                    userId={meetup.organizer_profile.id}
                    profileData={meetup.organizer_profile}
                  >
                    <div className="text-sm text-gray-500 flex items-center gap-2">
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
                      <p>
                        <Link href={`/${meetup.organizer_profile?.username}`}>
                          <span className="font-semibold text-black hover:underline">
                            {meetup.organizer_profile?.full_name ||
                              meetup.organizer_profile?.username ||
                              "알 수 없음"}
                          </span>
                        </Link>
                        <span className="ml-1">모임장</span>
                      </p>
                    </div>
                  </ProfileHoverCard>
                )}
                <Link href={`/socialing/meetup/${meetup.id}`}className="text-sm text-gray-500 pt-2 flex-grow">
                  {meetup.max_participants && (
                    <p className="flex items-center gap-1 mb-1">
                      <Users className="size-4" />
                      {meetup.max_participants}명
                    </p>
                  )}
                  {meetup.start_datetime && (
                    <p className="tracking-wide flex items-center gap-1 mb-1">
                      <Clock className="size-4" />
                      {formatDate(meetup.start_datetime)}
                      {meetup.end_datetime &&
                        formatDate(meetup.start_datetime) !==
                          formatDate(meetup.end_datetime) &&
                        ` - ${formatDate(meetup.end_datetime, false)}`}
                    </p>
                  )}
                  {meetup.location_description && (
                    <p className="flex items-center gap-1">
                      <MapPin className="size-4" />
                      {meetup.location_description}
                    </p>
                  )}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
