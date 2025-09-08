"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Database } from "@/types/database.types";
import TiptapViewer from "@/components/common/tiptap-viewer";
import { createClient } from "@/lib/supabase/client";

import {
  MEETUP_CATEGORIES,
  MEETUP_LOCATION_TYPES,
  MEETUP_STATUSES,
  MEETUP_PARTICIPANT_STATUSES,
  MEETUP_STATUS_DISPLAY_NAMES,
  MEETUP_LOCATION_TYPE_DISPLAY_NAMES,
  MEETUP_CATEGORY_DISPLAY_NAMES,
} from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
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
import {
  joinMeetup,
} from "@/app/socialing/meetup/meetup-actions";


// Helper Functions (copied from meetup-detail-client.tsx)
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
      return "border border-orange-500 bg-orange-50 text-orange-700";
    case MEETUP_CATEGORIES.CHALLENGE:
      return "border border-red-500 bg-red-50 text-red-700";
    case MEETUP_CATEGORIES.NETWORKING:
      return "border border-purple-500 bg-purple-50 text-purple-700";
    case MEETUP_CATEGORIES.ETC:
      return "border border-gray-500 bg-gray-50 text-gray-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700";
  }
}

function getLocationTypeBadgeClass(locationType: string) {
  switch (locationType) {
    case MEETUP_LOCATION_TYPES.ONLINE:
      return "border border-blue-500 bg-blue-50 text-blue-700";
    case MEETUP_LOCATION_TYPES.OFFLINE:
      return "border border-green-500 bg-green-50 text-green-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case MEETUP_STATUSES.UPCOMING:
      return "border border-gray-400 bg-gray-100 text-gray-700";
    case MEETUP_STATUSES.APPLY_AVAILABLE:
      return "border border-green-500 bg-green-50 text-green-700";
    case MEETUP_STATUSES.APPLY_CLOSED:
      return "border border-red-500 bg-red-50 text-red-700";
    case MEETUP_STATUSES.ENDED:
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
  const supabase = createClient();

  useEffect(() => {
    document.body.classList.add("no-footer");

    const channel = supabase
      .channel(`meetup_participants:${meetup.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meetup_participants",
          filter: `meetup_id=eq.${meetup.id}`,
        },
        async (payload) => {
          const newParticipant = payload.new as Database['public']['Tables']['meetup_participants']['Row'];
          
          // Fetch the profile for the new participant
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newParticipant.user_id)
            .single();

          if (error) {
            console.error("Error fetching profile for new participant:", error);
            return;
          }

          // Combine the new participant with their profile
          const newParticipantWithProfile = {
            ...newParticipant,
            profiles: profile,
          };

          setMeetup((prev) => ({
            ...prev,
            meetup_participants: [...prev.meetup_participants, newParticipantWithProfile],
          }));
        }
      )
      .subscribe();

    return () => {
      document.body.classList.remove("no-footer");
      supabase.removeChannel(channel);
    };
  }, [meetup.id, supabase]);

  const isApprovedParticipant = user
    ? meetup.meetup_participants.some(
        (p) =>
          p.profiles?.id === user.id &&
          p.status === MEETUP_PARTICIPANT_STATUSES.APPROVED
      )
    : false;

  const isPendingParticipant = user
    ? meetup.meetup_participants.some(
        (p) =>
          p.profiles?.id === user.id &&
          p.status === MEETUP_PARTICIPANT_STATUSES.PENDING
      )
    : false;
  const isMeetupFull = meetup.max_participants
    ? meetup.meetup_participants.length >= meetup.max_participants
    : false;

  const approvedParticipants = meetup.meetup_participants.filter(
    (p) => p.status === MEETUP_PARTICIPANT_STATUSES.APPROVED
  );
  const pendingParticipants = meetup.meetup_participants.filter(
    (p) => p.status === MEETUP_PARTICIPANT_STATUSES.PENDING
  );
  

  const handleApplyClick = () => {
    if (!user) {
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
        toast.success("모임 참가 신청이 완료되었습니다.");
      }
    });
  };

  

  const getButtonState = () => {
    if (isOrganizer) {
      return { disabled: true, text: "내가 만든 모임" };
    }
    if (meetup.status !== MEETUP_STATUSES.APPLY_AVAILABLE) {
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
    <div className="flex flex-col md:flex-row max-w-6xl mx-auto px-4 min-h-screen">
      <div className="w-full md:w-3/4 md:border-r md:pr-2 min-h-screen">
        <div className="max-w-3xl mx-auto p-4 pb-20">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold pb-2">{meetup.title}</h1>
            {isOrganizer && (
              <Link href={`/socialing/meetup/${meetup.id}/edit`}>
                <Button>수정</Button>
              </Link>
            )}
          </div>

          {/* 카테고리, 형태, 상태 배지 */}
          <div className="flex gap-2 mb-4">
            <Badge className={getStatusBadgeClass(meetup.status)}>
              {MEETUP_STATUS_DISPLAY_NAMES[meetup.status]}
            </Badge>
            <Badge className={getCategoryBadgeClass(meetup.category)}>
              {MEETUP_CATEGORY_DISPLAY_NAMES[meetup.category]}
            </Badge>
            <Badge className={getLocationTypeBadgeClass(meetup.location_type)}>
              {MEETUP_LOCATION_TYPE_DISPLAY_NAMES[meetup.location_type]}
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
            src={meetup.thumbnail_url || "/default_meetup_thumbnail.png"}
            alt={meetup.title}
            width={800} // Adjust as needed
            height={400} // Adjust as needed
            className="w-full h-64 object-cover object-center rounded-lg mb-6"
          />

          {/* 모임 상세 설명 */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3">모임 상세 설명</h2>
            <TiptapViewer content={meetup.description} />
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
      <div className="w-full md:w-1/4 mt-4 md:mt-0 flex flex-col h-full md:pl-2">
        <div className="md:block pl-6 pt-4 flex-grow pb-16">
          {meetup.clubs && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">주최 클럽</h2>
              <Link
                href={`/socialing/club/${meetup.clubs.id}`}
                className="inline-flex items-center gap-2 text-md font-semibold text-primary hover:underline"
              >
                <Image
                  src={meetup.clubs.thumbnail_url || "/default_club_thumbnail.png"}
                  alt={meetup.clubs.name || "Club Thumbnail"}
                  width={36}
                  height={36}
                  className="rounded-md aspect-square object-cover"
                />
                {meetup.clubs.name}
              </Link>
            </div>
          )}

          <div className="bg-white rounded-lg p-0 mb-6">
            <h2 className="text-xl font-semibold mb-2">
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
                  <div key={participant.profiles?.id} className="flex flex-col items-start gap-2 p-3 border rounded-lg w-48 flex-shrink-0 cursor-pointer">
                    <div className="flex items-center gap-2 w-full">
                      <Avatar className="size-10">
                        <AvatarImage src={participant.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {participant.profiles?.username?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {participant.profiles?.full_name || "알 수 없음"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{participant.profiles?.username || "알 수 없음"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 w-full truncate h-[1rem]">
                        {participant.profiles?.tagline}
                      </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">아직 확정된 참가자가 없습니다.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-0 mb-6">
            <h2 className="text-xl font-semibold mb-3">
              참가 대기중 ({pendingParticipants.length}명)
            </h2>
            <div className="flex flex-wrap gap-3">
              {pendingParticipants.length > 0 ? (
                pendingParticipants.map((participant) => (
                  <div key={participant.profiles?.id} className="flex flex-col items-start gap-2 p-3 border rounded-lg w-48 flex-shrink-0 cursor-pointer">
                    <div className="flex items-center gap-2 w-full">
                      <Avatar className="size-10">
                        <AvatarImage src={participant.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {participant.profiles?.username?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {participant.profiles?.full_name || "알 수 없음"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{participant.profiles?.username || "알 수 없음"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 w-full truncate h-[1rem]">
                        {participant.profiles?.tagline}
                      </p>
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
      </div>
    </div>
  );
}
