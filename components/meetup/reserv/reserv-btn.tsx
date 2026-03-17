"use client";

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

export default function ReservBtn() {
  const { pending } = useFormStatus();
  const router = useRouter();

  return (
    <div className="flex flex-row gap-[10px]">
      <button
        type="button"
        onClick={() => router.back()}
        className="w-1/6 h-9 bg-white border border-sydeblue rounded-xl px-2 py-1"
      >
        취소
      </button>
      <button
        type="submit"
        disabled={pending}
        className="w-5/6 h-9 bg-sydeblue text-white rounded-xl px-2 py-1 disabled:bg-gray-400"
      >
        {pending ? "신청 중..." : "신청하기 🚀"}
      </button>
    </div>
  );
}
