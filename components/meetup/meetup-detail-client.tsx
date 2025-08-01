"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

// 날짜 포맷 헬퍼 함수 (page.tsx에서 복사)
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

// 카테고리 배지 클래스 헬퍼 함수 (page.tsx에서 복사)
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

// 진행 방식 배지 클래스 헬퍼 함수 (page.tsx에서 복사)
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

// 상태 배지 클래스 헬퍼 함수 (page.tsx에서 복사)
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

interface MeetupDetailClientProps {
  meetup: any; // 실제 타입으로 교체 필요
  isOrganizer: boolean;
}

export default function MeetupDetailClient({ meetup, isOrganizer }: MeetupDetailClientProps) {
  // const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">{meetup.title}</h1>
        {isOrganizer && (
          <Link href={`/meetup/${meetup.id}/edit`}>
            <Button>수정</Button>
          </Link>
        )}
      </div>

      {/* 카테고리, 형태, 상태 배지 */}
      <div className="flex gap-2 mb-4">
        <Badge className={getStatusBadgeClass(meetup.status)}>{meetup.status}</Badge>
        <Badge className={getCategoryBadgeClass(meetup.category)}>{meetup.category}</Badge>
        <Badge className={getLocationTypeBadgeClass(meetup.location_type)}>{meetup.location_type}</Badge>
      </div>

      {/* 모임장 정보 */}
      <div className="flex items-center gap-2 mb-6 text-gray-600">
        <Avatar className="size-7">
          <AvatarImage src={meetup.organizer_profile?.avatar_url || undefined} />
          <AvatarFallback>{meetup.organizer_profile?.username?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <p>
          <span className="font-semibold text-black">
            {meetup.organizer_profile?.full_name || meetup.organizer_profile?.username || "알 수 없음"}
          </span>
          <span className="ml-1">모임장</span>
        </p>
      </div>

      {/* 일시 및 장소 정보 */}
      <div className="text-sm text-gray-500 mb-6">
        {meetup.start_datetime && (
          <p className="flex items-center gap-1 mb-1">
            <Clock className="size-4" />
            {formatDate(meetup.start_datetime)}
            {meetup.end_datetime &&
            formatDate(meetup.start_datetime) !== formatDate(meetup.end_datetime) &&
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

      {/* 썸네일 이미지 */}
      <img
        src={meetup.thumbnail_url || "https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/meetup-thumbnails//default_thumbnail.png"}
        alt={meetup.title}
        className="w-full h-64 object-cover rounded-lg mb-6"
      />

      {/* 모임 상세 설명 */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">모임 상세 설명</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{meetup.description}</p>
      </div>

      {/* 참가자 목록 */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">참가자 ({meetup.meetup_participants.length}명)</h2>
        <div className="flex flex-wrap gap-3">
          {meetup.meetup_participants.length > 0 ? (
            meetup.meetup_participants.map((participant) => (
              <div key={participant.profiles?.id} className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarImage src={participant.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{participant.profiles?.username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <p>{participant.profiles?.full_name || participant.profiles?.username || "알 수 없음"}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">아직 참가자가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
