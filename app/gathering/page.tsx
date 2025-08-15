import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Network } from "lucide-react";
import MeetupStatusFilter from "@/components/meetup/meetup-status-filter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClubList from "@/components/meetup/club-list";
import { Database, Enums } from "@/types/database.types";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

type MeetupWithOrganizerProfile = Database["public"]["Tables"]["meetups"]["Row"] & {
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
    case "스터디":
      return "border border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-50 hover:text-orange-700";
    case "챌린지":
      return "border border-red-500 bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700";
    case "네트워킹":
      return "border border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-50 hover:text-purple-700";
    case "기타":
      return "border border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700"; // 기본값
  }
}

function getLocationTypeBadgeClass(locationType: string) {
  switch (locationType) {
    case "온라인":
      return "border border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700";
    case "오프라인":
      return "border border-green-500 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700"; // 기본값
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "오픈예정":
      return "border border-gray-400 bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700";
    case "신청가능":
      return "border border-green-500 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700";
    case "신청마감":
      return "border border-red-500 bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700";
    case "종료":
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
  const selectedTab = awaitedSearchParams.tab || "meetups";

  // Fetch meetups
  let meetupQuery = supabase
    .from("meetups")
    .select(
      "*, clubs(id, name), organizer_profile:profiles!meetups_organizer_id_fkey(full_name, username, avatar_url, tagline), thumbnail_url, category, location_type, status, start_datetime, end_datetime, location_description, max_participants"
    )
    .order("created_at", { ascending: false });

  if (selectedStatus && selectedStatus !== "전체") {
    const validStatuses: Enums<"meetup_status_enum">[] = ["오픈예정", "신청가능", "신청마감", "종료"];
    if (validStatuses.includes(selectedStatus as Enums<"meetup_status_enum">)) {
      meetupQuery = meetupQuery.eq("status", selectedStatus as Enums<"meetup_status_enum">);
    }
  }

  const { data: meetups, error: meetupsError } = await meetupQuery;
  const typedMeetups = meetups as MeetupWithOrganizerProfile[];

  // Fetch clubs
  const { data: clubs, error: clubsError } = await supabase
    .from("clubs")
    .select("*, owner_profile:profiles!clubs_owner_id_fkey(avatar_url, bio, full_name, id, link, tagline, updated_at, username), member_count:club_members(count)")
    .order("created_at", { ascending: false });

  if (meetupsError || clubsError) {
    console.error("Error fetching data:", meetupsError || clubsError);
    return (
      <div className="container mx-auto p-4">
        데이터를 불러오는 데 실패했습니다.
      </div>
    );
  }
  
  const clubsWithMemberCount = clubs?.map(club => ({
    ...club,
    member_count: Array.isArray(club.member_count) ? club.member_count[0]?.count || 0 : 0,
  })) || [];


  return (
    <div className="w-full p-4">
      <Tabs defaultValue={selectedTab} className="w-full">
        <TabsList className="grid w-[300px] grid-cols-2">
          <TabsTrigger value="meetups">Meetups</TabsTrigger>
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
        </TabsList>
        <TabsContent value="meetups">
          <MeetupStatusFilter searchParams={awaitedSearchParams} />
          {meetups.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p>해당 모임이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typedMeetups.map((meetup) => (
                <div key={meetup.id} className="bg-white shadow-md rounded-lg max-w-sm mx-auto border border-gray-200 overflow-hidden h-full flex flex-col">
                  <Link href={`/gathering/meetup/${meetup.id}`}>
                    <div className="relative">
                      <Image
                        src={
                          meetup.thumbnail_url ||
                          "https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/meetup-images//default_thumbnail.png"
                        }
                        alt={meetup.title}
                        width={300}
                        height={200}
                        className={`w-full h-48 object-cover rounded-t-lg ${
                          meetup.status === "종료" ? "grayscale opacity-50" : ""
                        }`}
                      />
                      <div className="absolute top-3 left-3 flex gap-1">
                        <Badge className={getStatusBadgeClass(meetup.status)}>
                          {meetup.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                  <div className="px-6 pt-4 pb-6 flex-grow flex flex-col">
                    <Link href={`/gathering/meetup/${meetup.id}`}>
                      <h2 className="text-base font-semibold mb-2 line-clamp-3 hover:underline">
                        {meetup.title}
                      </h2>
                    </Link>
                    {meetup.clubs && (
                      <Link href={`/gathering/club/${meetup.clubs.id}`} className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:underline mb-2">
                        <Network className="size-4" />
                        <span>{meetup.clubs.name}</span>
                      </Link>
                    )}
                    <div className="flex gap-1 mb-4">
                      <Badge
                        className={getCategoryBadgeClass(meetup.category)}
                      >
                        {meetup.category}
                      </Badge>
                      <Badge
                        className={getLocationTypeBadgeClass(
                          meetup.location_type
                        )}
                      >
                        {meetup.location_type}
                      </Badge>
                    </div>
                    <HoverCard openDelay={350}>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <HoverCardTrigger asChild>
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
                        </HoverCardTrigger>
                        <p>
                          <HoverCardTrigger asChild>
                            <Link href={`/${meetup.organizer_profile?.username}`}>
                              <span className="font-semibold text-black hover:underline">
                                {meetup.organizer_profile?.full_name ||
                                  meetup.organizer_profile?.username ||
                                  "알 수 없음"}
                              </span>
                            </Link>
                          </HoverCardTrigger>
                          <span className="ml-1">모임장</span>
                        </p>
                      </div>
                      <HoverCardContent className="w-80" align="start" alignOffset={-28}>
                        {meetup.organizer_profile && (
                          <Link href={`/${meetup.organizer_profile.username}`}>
                            <div className="flex justify-start space-x-4">
                              {meetup.organizer_profile.avatar_url ? (
                                <Image
                                  src={meetup.organizer_profile.avatar_url}
                                  alt={`${meetup.organizer_profile.username || "User"}'s avatar`}
                                  width={64}
                                  height={64}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-2xl font-semibold">
                                    {meetup.organizer_profile.username?.charAt(0) || "U"}
                                  </span>
                                </div>
                              )}
                              <div className="space-y-1">
                                <h4 className="text-base font-semibold">
                                  {meetup.organizer_profile.full_name || ""}
                                </h4>
                                <p className="text-sm">@{meetup.organizer_profile.username || "Anonymous"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {meetup.organizer_profile.tagline || ""}
                                </p>
                              </div>
                            </div>
                          </Link>
                        )}
                      </HoverCardContent>
                    </HoverCard>
                    <div className="text-sm text-gray-500 mt-2 flex-grow">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="clubs">
          <ClubList clubs={clubsWithMemberCount} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
