"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Network, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Database } from "@/types/database.types";
import TiptapViewer from "@/components/common/tiptap-viewer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User } from "@supabase/supabase-js";
import { joinMeetup, approveMeetupParticipant } from "@/app/socialing/meetup/actions";
import { toast } from "sonner";

// 날짜 포맷 헬퍼 함수 (page.tsx에서 복사)
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

type Meetup = Database["public"]["Tables"]["meetups"]["Row"] & {
  clubs: Database["public"]["Tables"]["clubs"]["Row"] | null;
  organizer_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  meetup_participants: (Database["public"]["Tables"]["meetup_participants"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  })[];
};

interface MeetupDetailClientProps {
  meetup: Meetup;
  isOrganizer: boolean;
  user: User | null;
  joinedClubIds: string[];
}

export default function MeetupDetailClient({
  meetup: initialMeetup,
  isOrganizer,
  user,
  joinedClubIds,
}: MeetupDetailClientProps) {
  const [meetup, setMeetup] = useState(initialMeetup);
  const [isJoinClubDialogOpen, setIsJoinClubDialogOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    document.body.classList.add("no-footer");
    return () => {
      document.body.classList.remove("no-footer");
    };
  }, []);

  const isApprovedParticipant = user
    ? meetup.meetup_participants.some(
        (p) => p.profiles?.id === user.id && p.status === "approved"
      )
    : false;

  const isPendingParticipant = user
    ? meetup.meetup_participants.some(
        (p) => p.profiles?.id === user.id && p.status === "pending"
      )
    : false;
  const isMeetupFull = meetup.max_participants
    ? meetup.meetup_participants.length >= meetup.max_participants
    : false;

  const approvedParticipants = meetup.meetup_participants.filter(
    (p) => p.status === "approved"
  );
  const pendingParticipants = meetup.meetup_participants.filter(
    (p) => p.status === "pending"
  );

  const handleApplyClick = () => {
    if (!user) {
      // TODO: 로그인 다이얼로그 띄우기
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (meetup.club_id && !joinedClubIds.includes(meetup.club_id)) {
      setIsJoinClubDialogOpen(true);
      return;
    }

    startTransition(async () => {
      const result = await joinMeetup(meetup.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("모임에 참가했습니다!");
        // Optimistic update: Add the current user's profile to the participants list
        if (user) {
          const newParticipant = {
            profiles: {
              id: user.id,
              full_name: user.user_metadata.full_name || null,
              username: user.user_metadata.user_name || null,
              avatar_url: user.user_metadata.avatar_url || null,
              bio: null,
              link: null,
              tagline: null,
              updated_at: null,
            },
            status: "pending" as Database["public"]["Enums"]["meetup_participant_status_enum"], // Added status
            joined_at: new Date().toISOString(), // Add joined_at for optimistic update
            meetup_id: meetup.id, // Add meetup_id
            user_id: user.id, // Add user_id
          };
          setMeetup((prev) => ({
            ...prev,
            meetup_participants: [...prev.meetup_participants, newParticipant],
          }));
        }
      }
    });
  };

  const handleApproveParticipant = async (participantUserId: string) => {
    startTransition(async () => {
      const result = await approveMeetupParticipant(meetup.id, participantUserId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("참가자가 승인되었습니다!");
        // Optimistic UI update: Move participant from pending to approved
        setMeetup((prev) => {
          const updatedParticipants = prev.meetup_participants.map((p) =>
            p.user_id === participantUserId
              ? { ...p, status: "approved" as Database["public"]["Enums"]["meetup_participant_status_enum"] }
              : p
          );
          return { ...prev, meetup_participants: updatedParticipants };
        });
      }
    });
  };

  const getButtonState = () => {
    if (isOrganizer) {
      return { disabled: true, text: "내가 만든 모임" };
    }
    if (meetup.status !== "신청가능") {
      return { disabled: true, text: "신청기간이 아니에요" };
    }
    if (isApprovedParticipant) {
      return { disabled: true, text: "참가중" };
    }
    if (isPendingParticipant) {
      return { disabled: true, text: "참가대기중" };
    }
    if (isMeetupFull) {
      return { disabled: true, text: "정원 마감" };
    }
    return { disabled: false, text: "참가 신청하기" };
  };

  const buttonState = getButtonState();

  return (
    <div>
      <div className="max-w-3xl mx-auto p-4 pb-20">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold">{meetup.title}</h1>
          {isOrganizer && (
            <Link href={`/socialing/meetup/${meetup.id}/edit`}>
              <Button>수정</Button>
            </Link>
          )}
        </div>

        {meetup.clubs && (
          <div className="mb-4">
            <Link
              href={`/socialing/club/${meetup.clubs.id}`}
              className="inline-flex items-center gap-2 text-md font-semibold text-primary hover:underline"
            >
              <Network className="size-5" />
              {meetup.clubs.name}
            </Link>
          </div>
        )}

        {/* 카테고리, 형태, 상태 배지 */}
        <div className="flex gap-2 mb-4">
          <Badge className={getStatusBadgeClass(meetup.status)}>
            {meetup.status}
          </Badge>
          <Badge className={getCategoryBadgeClass(meetup.category)}>
            {meetup.category}
          </Badge>
          <Badge className={getLocationTypeBadgeClass(meetup.location_type)}>
            {meetup.location_type}
          </Badge>
        </div>

        {/* 모임장 정보 */}
        <div className="flex items-center gap-2 mb-6 text-gray-600">
          <Avatar className="size-7">
            <AvatarImage
              src={meetup.organizer_profile?.avatar_url || undefined}
            />
            <AvatarFallback>
              {meetup.organizer_profile?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <p>
            <span className="font-semibold text-black">
              {meetup.organizer_profile?.full_name ||
                meetup.organizer_profile?.username ||
                "알 수 없음"}
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

        {/* 썸네일 이미지 */}
        <Image
          src={
            meetup.thumbnail_url ||
            "https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/meetup-images//default_thumbnail.png"
          }
          alt={meetup.title}
          width={800} // Adjust as needed
          height={400} // Adjust as needed
          className="w-full h-64 object-cover rounded-lg mb-6"
        />

        {/* 모임 상세 설명 */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">모임 상세 설명</h2>
          <TiptapViewer content={meetup.description} />
        </div>

        {/* 참가자 (확정) 목록 */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">
            참가자 ({approvedParticipants.length}명)
          </h2>
          {meetup.max_participants && (
            <p className="text-sm text-gray-600 mb-3">
              최대 인원: {meetup.max_participants}명
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {approvedParticipants.length > 0 ? (
              approvedParticipants.map((participant) => (
                <div
                  key={participant.profiles?.id}
                  className="flex items-center gap-2"
                >
                  <Avatar className="size-6">
                    <AvatarImage
                      src={participant.profiles?.avatar_url || undefined}
                    />
                    <AvatarFallback>
                      {participant.profiles?.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <p>
                    {participant.profiles?.full_name ||
                      participant.profiles?.username ||
                      "알 수 없음"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">아직 확정된 참가자가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 참가 대기중인 멤버 목록 */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">
            참가 대기중 ({pendingParticipants.length}명)
          </h2>
          <div className="flex flex-wrap gap-3">
            {pendingParticipants.length > 0 ? (
              pendingParticipants.map((participant) => (
                <div
                  key={participant.profiles?.id}
                  className="flex items-center gap-2"
                >
                  <Avatar className="size-6">
                    <AvatarImage
                      src={participant.profiles?.avatar_url || undefined}
                    />
                    <AvatarFallback>
                      {participant.profiles?.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <p>
                    {participant.profiles?.full_name ||
                      participant.profiles?.username ||
                      "알 수 없음"}
                  </p>
                  {isOrganizer && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproveParticipant(participant.user_id)}
                    >
                      승인
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">
                현재 참가 대기중인 멤버가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 고정 하단 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t z-10">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-sm flex items-center gap-2">
              <Users className="size-5 text-gray-500" />
              <span className="font-bold text-lg">
                {approvedParticipants.length}명
              </span>
              {meetup.max_participants && (
                <span className="text-gray-500 text-sm">
                  {" "}
                  / {meetup.max_participants}명
                </span>
              )}
            </p>
          </div>
          <Button
            size="lg"
            disabled={buttonState.disabled}
            onClick={handleApplyClick}
          >
            {buttonState.text}
          </Button>
        </div>
      </div>

      <AlertDialog
        open={isJoinClubDialogOpen}
        onOpenChange={setIsJoinClubDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>클럽 가입 필요</AlertDialogTitle>
            <AlertDialogDescription>
              이 모임에 참가하려면 먼저 &apos;{meetup.clubs?.name}&apos; 클럽에
              가입해야 합니다. 클럽 페이지로 이동하여 가입하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link href={`/socialing/club/${meetup.club_id}`}>
                클럽으로 이동
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
