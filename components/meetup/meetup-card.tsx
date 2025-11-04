import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database.types";
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

interface MeetupCardProps {
  meetup: MeetupWithOrganizerProfile;
}

// Helper Functions (copied from meetup/page.tsx)
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

export default function MeetupCard({ meetup }: MeetupCardProps) {
  return (
    <div
      key={meetup.id}
      className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col transition-all duration-200 ease-in-out hover:shadow-xl hover:scale-[1.01]"
    >
      <Link href={`/meetup/${meetup.id}`}>
        <div className="relative aspect-w-3 aspect-h-2">
          <Image
            src={meetup.thumbnail_url || "/default_meetup_thumbnail.png"}
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
                className={getLocationTypeBadgeClass(meetup.location_type)}
              >
                {MEETUP_LOCATION_TYPE_DISPLAY_NAMES[meetup.location_type]}
              </Badge>
            </div>
          </div>
        </div>
      </Link>
      <div className="p-2 md:px-6 md:pb-4 md:pt-4 flex-grow flex-col">
        <Link href={`/meetup/${meetup.id}`} className="justyfy-between mb-2">
          <div className="flex justify-between items-start">
            <h2 className="text-sm md:text-base font-semibold line-clamp-2 hover:underline mr-2">
              {meetup.title}
            </h2>
          </div>
        </Link>
        <div className="flex-grow"></div>
        {meetup.clubs && (
          <Link
            href={`/club/${meetup.clubs.id}`}
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
                    src={meetup.organizer_profile?.avatar_url || undefined}
                  />
                  <AvatarFallback>
                    {meetup.organizer_profile?.username?.charAt(0) || "U"}
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
        <Link href={`/meetup/${meetup.id}`} className="text-sm text-gray-500">
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
  );
}
