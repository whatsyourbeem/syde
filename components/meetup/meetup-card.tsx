import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database.types";
import { MEETUP_STATUSES, MEETUP_STATUS_DISPLAY_NAMES } from "@/lib/constants";
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

function getStatusBadgeClass(status: string) {
  switch (status) {
    case MEETUP_STATUSES.UPCOMING:
      return "bg-gray-700 text-white px-2 py-[2px] md:py-1 my-1 text-xs font-medium hover:bg-gray-700 hover:text-gray-100";
    case MEETUP_STATUSES.APPLY_AVAILABLE:
      return "bg-green-700 text-white px-2 py-[2px] md:py-1 my-1 text-xs font-medium hover:bg-green-700 hover:text-green-50";
    case MEETUP_STATUSES.APPLY_CLOSED:
      return "bg-gray-200 text-gray-500 px-2 py-[2px] md:py-1 my-1  text-xs font-medium hover:bg-gray-200 hover:text-gray-700";
    case MEETUP_STATUSES.ENDED:
      return "bg-gray-200 text-gray-500 px-2 py-[2px] md:py-1 my-1  text-xs font-medium hover:bg-gray-200 hover:text-gray-700";
    default:
      return "bg-gray-700 text-gray-50 px-2 py-[2px] md:py-1 my-1 text-xs font-medium hover:bg-gray-700 hover:text-gray-50";
  }
}

export default function MeetupCard({ meetup }: MeetupCardProps) {
  return (
    <div
      key={meetup.id}
      className="bg-white overflow-hidden h-full flex flex-col transition-all duration-200 ease-in-out hover:scale-[1.01]"
    >
      <Link href={`/meetup/${meetup.id}`}>
        <div className="relative w-full aspect-w-1 aspect-h-1">
          <Image
            src={meetup.thumbnail_url || "/default_meetup_thumbnail.png"}
            alt={meetup.title}
            fill
            className={`object-cover object-center ${
              meetup.status === MEETUP_STATUSES.ENDED ? "grayscale" : ""
            }`}
          />
          {meetup.status === MEETUP_STATUSES.ENDED && (
            <div className="absolute inset-0 bg-white opacity-50"></div>
          )}
        </div>
      </Link>
      <div className="flex-grow flex-col">
        {/* Group 1: Status Badge, Meetup Title, Host/Club Info */}
        <div className="flex flex-col flex-grow gap-[6px] my-[6px]">
          <Badge className={`${getStatusBadgeClass(meetup.status)} w-fit`}>
            {MEETUP_STATUS_DISPLAY_NAMES[meetup.status]}
          </Badge>
          <Link href={`/meetup/${meetup.id}`}>
            <div className="flex justify-between items-start">
              <h2 className="text-sm md:text-base font-semibold line-clamp-2 hover:underline">
                {meetup.title}
              </h2>
            </div>
          </Link>
          {meetup.clubs && (
            <Link
              href={`/club/${meetup.clubs.id}`}
              className="inline-flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold text-gray-700 hover:underline"
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
              <div className="text-xs md:text-sm text-gray-500 flex items-center gap-1 md:gap-2">
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
                  <span className="ml-2">호스트</span>
                </p>
              </div>
            </ProfileHoverCard>
          )}
        </div>

        {/* Group 2: Date & Location Info */}
        <div>
          <Link href={`/meetup/${meetup.id}`} className="text-sm text-gray-500">
            <p className="text-[11px] md:text-sm text-gray-500 font-normal md:font-medium flex items-center gap-2 md:mb-1">
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
                  </span>
                </>
              )}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
