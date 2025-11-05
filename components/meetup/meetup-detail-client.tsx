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
import { Calendar, MapPin, Users, HelpCircle } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { User } from "@supabase/supabase-js";
import { Separator } from "@/components/ui/separator";
import {
  joinMeetup,
  updateMeetupParticipantStatus,
} from "@/app/meetup/meetup-actions";
import MemberCard from "@/components/user/MemberCard";
import MemberCardHorizontal from "@/components/user/MemberCardHorizontal";
import { CertifiedBadge } from "@/components/ui/certified-badge";

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

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatFee(fee: number | null) {
  if (fee === null || fee === 0) {
    return "무료";
  }
  return `${fee.toLocaleString()}원`;
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
  const [isJoinConfirmDialogOpen, setIsJoinConfirmDialogOpen] = useState(false);
  const [isJoinResultDialogOpen, setIsJoinResultDialogOpen] = useState(false);
  const [joinResult, setJoinResult] = useState<{
    error?: string;
    success?: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const handleStatusUpdate = (
    participantId: string,
    status: "APPROVED" | "PENDING"
  ) => {
    startTransition(async () => {
      const result = await updateMeetupParticipantStatus(
        meetup.id,
        participantId,
        status
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("참가자 상태가 변경되었습니다.");
      }
    });
  };

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
          const newParticipant =
            payload.new as Database["public"]["Tables"]["meetup_participants"]["Row"];

          // Fetch the profile for the new participant
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newParticipant.user_id)
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
            meetup_participants: [
              ...prev.meetup_participants,
              newParticipantWithProfile,
            ],
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "meetup_participants",
          filter: `meetup_id=eq.${meetup.id}`,
        },
        (payload) => {
          const updatedParticipant =
            payload.new as Database["public"]["Tables"]["meetup_participants"]["Row"];

          setMeetup((prev) => ({
            ...prev,
            meetup_participants: prev.meetup_participants.map((p) =>
              p.user_id === updatedParticipant.user_id
                ? { ...p, status: updatedParticipant.status }
                : p
            ),
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

    if (isPendingParticipant) {
      setJoinResult(null); // Clear previous result
      setIsJoinResultDialogOpen(true);
    } else {
      setIsJoinConfirmDialogOpen(true);
    }
  };

  const handleConfirmJoin = () => {
    setIsJoinConfirmDialogOpen(false);
    startTransition(async () => {
      const result = await joinMeetup(meetup.id);
      setJoinResult(result);
      setIsJoinResultDialogOpen(true);
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
      return {
        disabled: false,
        text: (
          <>
            참가대기중
            <HelpCircle className="size-5" />
          </>
        ),
      };
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
        <div className="max-w-3xl mx-auto pt-4 px-0 md:px-4 pb-20">
          {/* 상태 배지 */}
          <div className="flex gap-2 mb-4">
            <Badge className={getStatusBadgeClass(meetup.status)}>
              {MEETUP_STATUS_DISPLAY_NAMES[meetup.status]}
            </Badge>
          </div>

          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl md:text-3xl font-bold pb-2">
              {meetup.title}
            </h1>
            {isOrganizer && (
              <Link href={`/meetup/${meetup.id}/edit`}>
                <Button>수정</Button>
              </Link>
            )}
          </div>

          {/* 호스트 정보 */}
          <div className="flex items-center gap-2 mb-6 text-gray-600 text-sm md:text-base">
            <Avatar className="size-6 md:size-7">
              <AvatarImage
                src={meetup.organizer_profile?.avatar_url || undefined}
              />
              <AvatarFallback>
                {meetup.organizer_profile?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <p className="flex items-center">
              <span className="font-semibold text-black">
                {meetup.organizer_profile?.full_name ||
                  meetup.organizer_profile?.username ||
                  "알 수 없음"}
              </span>
              {meetup.organizer_profile?.certified && (
                <CertifiedBadge size="sm" className="ml-1" />
              )}
              <span className="ml-1">호스트</span>
            </p>
          </div>

          {/* 새로운 썸네일 및 정보 영역 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* 왼쪽: 썸네일 이미지 */}
            <div className="w-full md:w-1/2">
              <Image
                src={meetup.thumbnail_url || "/default_meetup_thumbnail.png"}
                alt={meetup.title}
                width={800} // Adjust as needed
                height={400} // Adjust as needed
                className="w-full h-48 md:h-64 object-cover object-center rounded-lg"
              />
            </div>
            {/* 오른쪽: 모임 장소, 모임일시, 최대인원 정보 */}
            <div className="w-full md:w-1/2 flex flex-col justify-center p-4 md:p-5 border rounded-lg">
              {meetup.start_datetime && (
                <p className="flex items-start gap-3 mb-6 text-black text-sm md:text-base font-bold">
                  <Calendar className="size-5 md:size-6 text-black" />
                  <span>
                    {formatDate(meetup.start_datetime)}
                    {meetup.end_datetime &&
                      formatDate(meetup.start_datetime) !==
                        formatDate(meetup.end_datetime) &&
                      ` - ${formatDate(meetup.end_datetime, false)}`}
                    <br />
                    <span className="text-xs md:text-sm text-gray-500 font-normal">
                      {formatTime(meetup.start_datetime)}
                      {meetup.end_datetime &&
                        formatDate(meetup.start_datetime) ===
                          formatDate(meetup.end_datetime) &&
                        ` - ${formatTime(meetup.end_datetime)}`}
                    </span>
                  </span>
                </p>
              )}
              {(meetup.location || meetup.address) && (
                <p className="flex items-start gap-3 mb-6 text-black text-sm md:text-base font-bold">
                  <MapPin className="size-5 md:size-6 text-black" />
                  <span>
                    {meetup.location}
                    {meetup.location && meetup.address && <br />}
                    {meetup.address && (
                      <span className="text-xs md:text-sm text-gray-500 font-normal">
                        {meetup.address}
                      </span>
                    )}
                  </span>
                </p>
              )}
              <p className="flex items-start gap-3 text-black text-sm md:text-base font-bold">
                <Users className="size-5 md:size-6 text-black" />
                <span>
                  {meetup.max_participants
                    ? `${meetup.max_participants}명`
                    : "무제한"}
                  <br />
                  <span className="text-xs md:text-sm text-gray-500 font-normal">
                    최대 인원
                  </span>
                </span>
              </p>
            </div>
          </div>

          {/* 모임 상세 설명 */}
          <div className="bg-white rounded-lg mb-6">
            <h2 className="text-2xl md:text-xl font-bold mb-4">
              💬<span className="font-extrabold pl-2">모임 설명</span>
            </h2>
            <TiptapViewer content={meetup.description} />
          </div>
        </div>

        {/* 고정 하단 바 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-10 px-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center px-2 py-3 md:p-4">
            <p className="text-sm flex items-center gap-2">
              <span className="text-xs text-black">참가비</span>
              <span className="font-extrabold text-base md:text-xl">
                {formatFee(meetup.fee)}
              </span>
            </p>
            <div className="flex items-center gap-4">
              <p className="text-sm flex items-center gap-2">
                <Users className="size-3 md:size-5 text-gray-500" />
                <span className="font-bold text-sm md:text-lg">
                  {approvedParticipants.length}
                  {meetup.max_participants
                    ? ` / ${meetup.max_participants}`
                    : ""}
                </span>
              </p>
              <Button
                size="sm"
                className="md:h-10 md:px-8 md:text-sm"
                disabled={buttonState.disabled}
                onClick={handleApplyClick}
              >
                {buttonState.text}
              </Button>
            </div>
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
                이 모임에 참가하려면 먼저 &apos;{meetup.clubs?.name}&apos;
                클럽에 가입해야 합니다. 클럽 페이지로 이동하여 가입하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Link href={`/club/${meetup.club_id}`}>클럽으로 이동</Link>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isJoinConfirmDialogOpen}
          onOpenChange={setIsJoinConfirmDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>모임 참가 신청</AlertDialogTitle>
              <AlertDialogDescription>
                &apos;{meetup.title}&apos; 모임에 참가 신청하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmJoin}>
                확인
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isJoinResultDialogOpen}
          onOpenChange={setIsJoinResultDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {joinResult?.error ? "오류" : "신청 완료"}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="text-sm text-muted-foreground">
              {joinResult?.error ? (
                joinResult.error
              ) : (
                <>
                  {!(meetup.fee && meetup.fee > 0) && (
                    <div className="mb-4">모임 참가 신청이 완료되었습니다.</div>
                  )}
                  {meetup.fee && meetup.fee > 0 && (
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md mt-4">
                      <div className="font-semibold">참가 확정 안내</div>
                      <div className="mt-2">
                        참가비를 아래 계좌로 입금해주시면 24시간 내로 참가
                        신청이 확정됩니다.
                      </div>
                      <div className="mt-2 text-red-500 font-semibold">
                        * 입금자명은 반드시 본인의 유저네임으로 해주세요.
                      </div>
                      <div className="mt-2 font-mono bg-gray-100 p-2 rounded">
                        신한은행 110-320-955821 (안재현)
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => setIsJoinResultDialogOpen(false)}
              >
                확인
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {meetup.clubs && <Separator className="my-4 block md:hidden" />}

      <div className="w-full md:w-1/4 md:mt-0 flex flex-col h-full md:pl-2">
        <div className="flex-grow pb-16">
          {meetup.clubs && (
            <div className="py-4 md:pl-6">
              <div>
                <h2 className="text-2xl md:text-xl font-bold mb-4">
                  🌟<span className="font-extrabold pl-2">주최 클럽</span>
                </h2>
                <Link
                  href={`/club/${meetup.clubs.id}`}
                  className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={
                        meetup.clubs.thumbnail_url ||
                        "/default_club_thumbnail.png"
                      }
                      alt={meetup.clubs.name || "Club Thumbnail"}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover"
                    />
                  </div>
                  {meetup.clubs.name}
                </Link>
              </div>
            </div>
          )}

          <Separator className="my-4 block md:hidden" />

          {/* Desktop View: Accordion */}
          <div className="hidden px-4 pt-4 md:px-0 md:pl-6 md:block">
            <h2 className="text-xl font-bold mb-4">
              👥
              <span className="font-extrabold pl-2">
                참가자 ({approvedParticipants.length}
                {meetup.max_participants ? `/${meetup.max_participants}` : ""})
              </span>
            </h2>
            <Accordion
              type="multiple"
              className="w-full"
              defaultValue={["approved", "pending"]}
            >
              <AccordionItem value="approved">
                <AccordionTrigger className="text-sm font-semibold pt-2">
                  <div className="flex items-center gap-1 flex-grow">
                    참가 확정
                    <span className="text-muted-foreground">
                      ({approvedParticipants.length})
                    </span>
                    <div className="flex-grow border-b border-gray-300 ml-2"></div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 py-2">
                    {approvedParticipants.length > 0 ? (
                      approvedParticipants.map((participant) => {
                        if (!participant.profiles) return null;
                        return (
                          <MemberCard
                            key={participant.user_id}
                            profile={participant.profiles}
                            tagline={participant.profiles.tagline}
                            isOwner={
                              participant.user_id === meetup.organizer_id
                            }
                            isCurrentUser={participant.user_id === user?.id}
                            showButton={
                              isOrganizer &&
                              participant.user_id !== meetup.organizer_id
                            }
                            buttonText="확정 취소"
                            onButtonClick={() =>
                              handleStatusUpdate(
                                participant.profiles!.id,
                                MEETUP_PARTICIPANT_STATUSES.PENDING
                              )
                            }
                            isLoading={isPending}
                          />
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm py-2">
                        아직 확정된 참가자가 없습니다.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pending">
                <AccordionTrigger className="text-sm font-semibold pt-2">
                  <div className="flex items-center gap-1 flex-grow">
                    참가 대기중
                    <span className="text-muted-foreground">
                      ({pendingParticipants.length})
                    </span>
                    <div className="flex-grow border-b border-gray-300 ml-2"></div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 py-2">
                    {pendingParticipants.length > 0 ? (
                      pendingParticipants.map((participant) => {
                        if (!participant.profiles) return null;
                        return (
                          <MemberCard
                            key={participant.user_id}
                            profile={participant.profiles}
                            tagline={participant.profiles.tagline}
                            isOwner={false}
                            isCurrentUser={participant.user_id === user?.id}
                            showButton={isOrganizer}
                            buttonText="참가 확정"
                            onButtonClick={() =>
                              handleStatusUpdate(
                                participant.profiles!.id,
                                MEETUP_PARTICIPANT_STATUSES.APPROVED
                              )
                            }
                            isLoading={isPending}
                          />
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm py-2">
                        현재 참가 대기중인 멤버가 없습니다.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Mobile View: Horizontal Scroll */}
          <div className="py-4 block md:hidden">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">
                👥
                <span className="font-extrabold pl-2">
                  참가자 ({approvedParticipants.length}
                  {meetup.max_participants ? `/${meetup.max_participants}` : ""}
                  )
                </span>
              </h2>
              <h2 className="text-base font-semibold mb-2">
                참가 확정 ({approvedParticipants.length})
              </h2>
              {approvedParticipants.length > 0 ? (
                <div className="py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                  <div className="flex flex-row gap-4">
                    {approvedParticipants.map((participant) => {
                      if (!participant.profiles) return null;
                      return (
                        <MemberCardHorizontal
                          key={participant.user_id}
                          profile={participant.profiles}
                          isOwner={participant.user_id === meetup.organizer_id}
                          isCurrentUser={participant.user_id === user?.id}
                          showButton={
                            isOrganizer &&
                            participant.user_id !== meetup.organizer_id
                          }
                          buttonText="확정 취소"
                          onButtonClick={() =>
                            handleStatusUpdate(
                              participant.profiles!.id,
                              MEETUP_PARTICIPANT_STATUSES.PENDING
                            )
                          }
                          isLoading={isPending}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  아직 확정된 참가자가 없습니다.
                </p>
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">
                참가 대기중 ({pendingParticipants.length})
              </h2>
              {pendingParticipants.length > 0 ? (
                <div className="py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                  <div className="flex flex-row gap-4">
                    {pendingParticipants.map((participant) => {
                      if (!participant.profiles) return null;
                      return (
                        <MemberCardHorizontal
                          key={participant.user_id}
                          profile={participant.profiles}
                          isOwner={false}
                          isCurrentUser={participant.user_id === user?.id}
                          showButton={isOrganizer}
                          buttonText="참가 확정"
                          onButtonClick={() =>
                            handleStatusUpdate(
                              participant.profiles!.id,
                              MEETUP_PARTICIPANT_STATUSES.APPROVED
                            )
                          }
                          isLoading={isPending}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
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
