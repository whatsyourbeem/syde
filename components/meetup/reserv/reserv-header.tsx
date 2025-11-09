"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReservHeader() {
  const router = useRouter();
  return (
    <div className="relative flex just items-center text-center p-5">
      <button
        className="absolute p-2 rounded-full text-muted-foreground hover:bg-secondary"
        aria-label="Go back"
      >
        <ChevronLeft onClick={() => router.back()} size={24} />
      </button>
      <h2 className="w-full h-[29px] text-2xl leading-none font-bold text-foreground">
        모임 참가 신청
      </h2>
    </div>
  );
}
