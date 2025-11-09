"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import ReservInput from "@/components/meetup/reserv/reserv-input";
import ReservBtn from "@/components/meetup/reserv/reserv-btn";
import ReservHeader from "@/components/meetup/reserv/reserv-header";
import { createMeetupParticipant, FormState } from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const initialState: FormState = {};

export default function MeetupReservPage({
  params,
}: {
  params: { meetup_id: string };
}) {
  const router = useRouter();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const createMeetupParticipantWithId = createMeetupParticipant.bind(
    null,
    params.meetup_id
  );
  const [state, formAction] = useFormState(
    createMeetupParticipantWithId,
    initialState
  );

  // Placeholder for meetup details, as the original ReservBtn had it.
  // In a real app, you'd fetch this data.
  const meetup = { id: params.meetup_id, fee: 5000 }; // Assuming a fee for dialog display

  useEffect(() => {
    if (state.success) {
      setShowSuccessDialog(true);
    }
  }, [state.success]);

  const handleDialogConfirm = () => {
    setShowSuccessDialog(false);
    router.push(`/meetup/${params.meetup_id}/reserv/success`);
  };

  return (
    <form action={formAction} className="w-full max-w-lg mx-auto text-[#23292F]">
      <ReservHeader />
      <div className="w-full flex flex-col border-white border-t-[0.5px] px-5 py-4 gap-9">
        <div className="w-full h-[75px] justify-center flex flex-col gap-1 leading-loose align-middle [hanging-punctuation:first]">
          <h2 className="text-2xl font-semibold">우리, 함께, SYDE! ✨</h2>
          <p className="text-base font-semibold">
            번호를 남기시면 문자로 챙겨드릴게요 💌
          </p>
        </div>
        <div className="flex flex-col justify-center gap-5">
          <ReservInput
            name="이름"
            placeholder="닉네임을 입력해주세요."
            description="이 이름으로 이름 스티커를 드릴거에요."
          />
          <ReservInput
            name="휴대폰 번호"
            placeholder="문자 안내를 받을 번호예요 📱"
            description="모임 안내 외 용도로 사용되지 않아요. 😌"
          />
          <ReservInput
            name="입금자명"
            placeholder="입금 확인을 위해 정확히 입력해주세요."
            description="참가비를 계좌이체하시면, 호스트가 확인 후 확정해드려요."
          />
          <ReservInput
            name="모임에서 나누고 싶은 이야기"
            className="h-14 pb-[22px]"
            placeholder="궁금한 것, 요즘 고민 등 자유롭게 적어주세요. 💬"
          />
        </div>
        <ReservBtn />
        {state.error && (
          <p className="mt-4 text-center text-sm text-red-500">
            {state.error}
          </p>
        )}
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {!(meetup.fee && meetup.fee > 0) ? "신청 완료" : "참가 확정 안내"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          {!(meetup.fee && meetup.fee > 0) ? (
            <p>모임 참가 신청이 완료되었습니다.</p>
          ) : (
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
              <div className="mt-2">
                참가비를 아래 계좌로 입금해주시면 24시간 내로 참가 신청이
                확정됩니다.
              </div>
              <div className="mt-2 text-red-500 font-semibold">
                * 입금자명은 반드시 본인의 유저네임으로 해주세요.
              </div>
              <div className="mt-2 font-mono bg-gray-100 p-2 rounded">
                신한은행 110-320-955821 (안재현)
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDialogConfirm}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
