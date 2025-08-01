import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function getCategoryBadgeClass(category: string) {
  switch (category) {
    case "스터디":
      return "border border-orange-500 bg-orange-50 text-orange-700";
    case "챌린지":
      return "border border-red-500 bg-red-50 text-red-700";
    case "네트워킹":
      return "border border-purple-500 bg-purple-50 text-purple-700";
    case "기타":
      return "border border-gray-500 bg-gray-50 text-gray-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700"; // 기본값
  }
}

function getLocationTypeBadgeClass(locationType: string) {
  switch (locationType) {
    case "온라인":
      return "border border-blue-500 bg-blue-50 text-blue-700";
    case "오프라인":
      return "border border-green-500 bg-green-50 text-green-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700"; // 기본값
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "오픈예정":
      return "border border-gray-400 bg-gray-100 text-gray-700";
    case "신청가능":
      return "border border-green-500 bg-green-50 text-green-700";
    case "신청마감":
      return "border border-red-500 bg-red-50 text-red-700";
    case "종료":
      return "border border-gray-500 bg-gray-50 text-gray-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700";
  }
}

export default async function MeetupPage() {
  const supabase = await createClient();

  const { data: meetups, error } = await supabase
    .from("meetups")
    .select(
      "*, organizer_profile:profiles!meetups_organizer_id_fkey(full_name, username, avatar_url), thumbnail_url, category, location_type, status"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching meetups:", error);
    return (
      <div className="container mx-auto p-4">
        모임을 불러오는 데 실패했습니다.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">모임 목록</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meetups.map((meetup) => (
          <div
            key={meetup.id}
            className="bg-white shadow-md rounded-lg max-w-sm mx-auto border border-gray-200 overflow-hidden"
          >
            <div className="relative">
              <img
                src={
                  meetup.thumbnail_url ||
                  "https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/meetup-thumbnails//default_thumbnail.png"
                }
                alt={meetup.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="absolute top-3 left-3 flex gap-1">
                <Badge className={getStatusBadgeClass(meetup.status)}>{meetup.status}</Badge>
              </div>
            </div>
            <div className="px-6 pt-4 pb-6">
              <h2 className="text-base font-semibold mb-2">{meetup.title}</h2>
              <div className="flex gap-1 mb-4">
                <Badge className={getCategoryBadgeClass(meetup.category)}>{meetup.category}</Badge>
                <Badge className={getLocationTypeBadgeClass(meetup.location_type)}>{meetup.location_type}</Badge>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Avatar className="size-5">
                  {" "}
                  {/* 아바타 컴포넌트 추가 */}
                  <AvatarImage
                    src={meetup.organizer_profile?.avatar_url || undefined}
                  />
                  <AvatarFallback>
                    {meetup.organizer_profile?.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <p>
                  <span className="font-semibold">
                    {meetup.organizer_profile?.full_name ||
                      meetup.organizer_profile?.username ||
                      "알 수 없음"}
                  </span>
                  <span className="ml-1">모임장</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
