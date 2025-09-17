import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Tables, Enums } from "@/types/database.types";
import {
  MEETUP_CATEGORIES,
  MEETUP_LOCATION_TYPES,
  MEETUP_STATUSES,
  MEETUP_CATEGORY_DISPLAY_NAMES,
  MEETUP_LOCATION_TYPE_DISPLAY_NAMES,
  MEETUP_STATUS_DISPLAY_NAMES,
} from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users } from "lucide-react";
import { CertifiedBadge } from "@/components/ui/certified-badge";

type Profile = Tables<"profiles">;
type Meetup = Tables<"meetups"> & { organizer_profile: Profile | null };

type ClubMeetupListPageProps = {
  params: Promise<{
    club_id: string;
  }>;
};

// Helper Functions (copied from club-detail-client.tsx)
function formatDate(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);

  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = hours.toString().padStart(2, "0");

  return `${year}.${month}.${day}(${weekday}) ${formattedHours}:${minutes}${ampm}`;
}

function getStatusBadgeClass(status: Enums<"meetup_status_enum">) {
  switch (status) {
    case MEETUP_STATUSES.UPCOMING:
      return "border-gray-400 bg-gray-100 text-gray-700 px-1 ";
    case MEETUP_STATUSES.APPLY_AVAILABLE:
      return "border-green-500 bg-green-50 text-green-700 px-1";
    case MEETUP_STATUSES.APPLY_CLOSED:
      return "border-red-500 bg-red-50 text-red-700 px-1 ";
    case MEETUP_STATUSES.ENDED:
      return "border-gray-500 bg-gray-50 text-gray-700 px-2 ";
    default:
      return "border-gray-500 bg-gray-50 text-gray-700";
  }
}

function getCategoryBadgeClass(category: Enums<"meetup_category_enum">) {
  switch (category) {
    case MEETUP_CATEGORIES.STUDY:
      return "bg-blue-100 text-blue-800 px-1";
    case MEETUP_CATEGORIES.CHALLENGE:
      return "bg-purple-100 text-purple-800 px-1";
    case MEETUP_CATEGORIES.NETWORKING:
      return "bg-yellow-100 text-yellow-800 px-1";
    case MEETUP_CATEGORIES.ETC:
      return "bg-gray-100 text-gray-800 px-2";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getLocationTypeBadgeClass(
  locationType: Enums<"meetup_location_type_enum">
) {
  switch (locationType) {
    case MEETUP_LOCATION_TYPES.ONLINE:
      return "bg-green-100 text-green-800 px-1";
    case MEETUP_LOCATION_TYPES.OFFLINE:
      return "bg-red-100 text-red-800 px-1";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function ClubMeetupListPage({
  params,
}: ClubMeetupListPageProps) {
  const supabase = await createClient();
  const { club_id } = await params;

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("name")
    .eq("id", club_id)
    .single();

  const { data: meetups, error: meetupsError } = await supabase
    .from("meetups")
    .select("id, created_at, organizer_id, club_id, title, description, thumbnail_url, category, location_type, status, start_datetime, end_datetime, location, address, max_participants, fee, organizer_profile:profiles!meetups_organizer_id_fkey(*)")
    .eq("club_id", club_id)
    .order("start_datetime", { ascending: false });

  if (clubError || !club) {
    notFound();
  }

  if (meetupsError) {
    console.error("Error fetching meetups:", meetupsError);
    // Optionally, you can render an error message to the user
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6">
        &apos;{club.name}&apos; 클럽 모임
      </h1>
      {meetups && meetups.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {(meetups as Meetup[]).map((meetup) => (
            <Card
              key={meetup.id}
              className="h-full transition-shadow hover:shadow-lg"
            >
              <CardContent className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center p-0">
                <div className="relative aspect-square h-full hidden sm:block">
                  <Image
                    src={
                      meetup.thumbnail_url || "/default_meetup_thumbnail.png"
                    }
                    alt={meetup.title}
                    fill
                    className="object-cover object-center rounded-l-md"
                  />
                </div>
                <Link
                  href={`/socialing/meetup/${meetup.id}`}
                  className="flex flex-col flex-grow p-4"
                >
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={`${getStatusBadgeClass(
                          meetup.status
                        )} text-xs`}
                      >
                        {MEETUP_STATUS_DISPLAY_NAMES[meetup.status]}
                      </Badge>
                      <Badge
                        className={`${getCategoryBadgeClass(
                          meetup.category
                        )} text-xs`}
                      >
                        {MEETUP_CATEGORY_DISPLAY_NAMES[meetup.category]}
                      </Badge>
                      <Badge
                        className={`${getLocationTypeBadgeClass(
                          meetup.location_type
                        )} text-xs`}
                      >
                        {
                          MEETUP_LOCATION_TYPE_DISPLAY_NAMES[
                            meetup.location_type
                          ]
                        }
                      </Badge>
                    </div>
                    <h3 className="font-semibold line-clamp-2">
                      {meetup.title}
                    </h3>
                    <div className="text-xs text-muted-foreground space-y-1 mt-1">
                      {meetup.start_datetime && (
                        <p className="flex items-center gap-1.5">
                          <Clock className="size-3" />{" "}
                          {formatDate(meetup.start_datetime)}
                        </p>
                      )}
                      {(meetup.location || meetup.address) && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="size-3" />{" "}
                          {meetup.location}
                          {meetup.location && meetup.address && " ("}
                          {meetup.address}
                          {meetup.location && meetup.address && ")"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarImage
                          src={
                            meetup.organizer_profile?.avatar_url || undefined
                          }
                        />
                        <AvatarFallback>
                          {meetup.organizer_profile?.username?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium">
                          {meetup.organizer_profile?.full_name ||
                            meetup.organizer_profile?.username}
                        </span>
                        {meetup.organizer_profile?.certified && <CertifiedBadge size="sm" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" />
                      <span>{meetup.max_participants || "무제한"}</span>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>이 클럽에서 주최하는 모임이 아직 없습니다.</p>
        </div>
      )}
    </div>
  );
}
