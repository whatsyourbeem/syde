"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { submitApplication } from "@/app/meetup/[meetup_id]/reserv/action";

type Meetup = {
  id: string;
  fee: number | null;
};

type ReservBtnProps = {
  meetup: Meetup;
};

export default function ReservBtn({ meetup }: ReservBtnProps) {
  if (!meetup) {
    return null;
  }

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [joinResult, setJoinResult] = useState<{
    error?: string;
    success?: boolean;
  } | null>(null);

  const handleApply = async () => {
    setIsSubmitting(true);
    setJoinResult(null);

    try {
      const result = await submitApplication(meetup.id);
      setJoinResult(result);

      if (result.success) {
        setShowSuccessDialog(true);
      }
    } catch (e) {
      console.error(e);
      setJoinResult({
        error: "클라이언트에서 예상치 못한 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-row gap-[10px]">
        <button
          onClick={() => router.back()}
          className="w-1/6 h-9 bg-white border border-[#23292F] rounded-xl px-2 py-1"
        >
          취소
        </button>
        <button
          onClick={handleApply}
          disabled={isSubmitting}
          className="w-5/6 h-9 bg-[#23292F] text-white rounded-xl px-2 py-1 disabled:bg-gray-400"
        >
          {isSubmitting ? "신청 중..." : "신청하기 🚀"}
        </button>
      </div>

      {joinResult?.error && (
        <p className="mt-2 text-sm text-red-500">{joinResult.error}</p>
      )}

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
            <AlertDialogAction onClick={() => router.back()}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
