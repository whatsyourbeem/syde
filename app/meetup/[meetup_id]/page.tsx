import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import MeetupDetailClient from "@/components/meetup/meetup-detail-client";

// 날짜 포맷 헬퍼 함수
function formatDate(dateString: string, includeYear: boolean = true) {
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });

  if (includeYear) {
    return `${year}.${month}.${day}(${weekday})`;
  } else {
    return `${month}.${day}(${weekday})`;
  }
}

// 카테고리 배지 클래스 헬퍼 함수
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
      return "border border-gray-500 bg-gray-50 text-gray-700";
  }
}

// 진행 방식 배지 클래스 헬퍼 함수
function getLocationTypeBadgeClass(locationType: string) {
  switch (locationType) {
    case "온라인":
      return "border border-blue-500 bg-blue-50 text-blue-700";
    case "오프라인":
      return "border border-green-500 bg-green-50 text-green-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700";
  }
}

// 상태 배지 클래스 헬퍼 함수
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

export default async function MeetupDetailPage({ params }: { params: { meetup_id: string } }) {
  const supabase = await createClient();

  const { meetup_id } = await params;

  const { data: meetup, error } = await supabase
    .from("meetups")
    .select(
      "*, organizer_profile:profiles!meetups_organizer_id_fkey(full_name, username, avatar_url), meetup_participants(profiles(id, full_name, username, avatar_url)), category, location_type, status, start_datetime, end_datetime, location_description"
    )
    .eq("id", meetup_id)
    .single();

  if (error || !meetup) {
    console.error("Error fetching meetup details:", error);
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const isOrganizer = user?.id === meetup.organizer_id;

  return (
    <MeetupDetailClient meetup={meetup} isOrganizer={isOrganizer} />
  );
}
