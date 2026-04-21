"use client";

import { HelpCircle, Crown, Trophy, Megaphone, Gift, TrendingUp } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SydePickInfoDialogProps {
  className?: string;
  size?: number;
}

export function SydePickInfoDialog({ className, size = 18 }: SydePickInfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={cn(
            "p-1 text-white/50 hover:text-white transition-colors cursor-pointer outline-none",
            className
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label="SYDE Pick 정보"
        >
          <HelpCircle size={size} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[440px] p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl">
        <div className="bg-[#0F172A] px-6 py-6 relative overflow-hidden">
          {/* Background Spotlight Image */}
          <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
            <Image
              src="/spotlight.png"
              alt="Spotlight Background"
              fill
              priority
              className="object-cover"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-sydeorange rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-sydeorange/20">
              <Crown className="text-white" size={24} />
            </div>
            <DialogTitle className="text-2xl font-['Paperlogy'] font-extrabold text-white mb-1">
              SYDE Pick 안내
            </DialogTitle>
          </div>
        </div>

        <div className="px-6 py-8 flex flex-col gap-6">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <Trophy className="text-sydeorange" size={20} />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-bold text-[16px] text-gray-900">어떻게 선정되나요?</h4>
              <p className="text-[13px] text-gray-500 leading-normal">
                매주 일요일 저녁, 실시간 트렌딩 가중치가 적용된 알고리즘을 통해 업보트 1위 프로젝트를 선정합니다. (여러 번 중복 선정 가능)
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Megaphone className="text-blue-500" size={20} />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-bold text-[16px] text-gray-900">어떤 혜택이 있나요?</h4>
              <p className="text-[13px] text-gray-500 leading-normal">
                일주일간 페이지 최상단 노출, SYDE 오픈채팅방 공지사항 등록, 그리고 공식 SNS 채널을 통해 프로젝트를 소개합니다.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start relative overflow-hidden group">
            <div className="absolute inset-0 bg-sydeorange/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-xl" />
            <div className="w-10 h-10 bg-sydeorange/10 rounded-xl flex items-center justify-center shrink-0 z-10">
              <Gift className="text-sydeorange" size={20} />
            </div>
            <div className="flex flex-col gap-1 z-10">
              <h4 className="font-bold text-[16px] text-sydeorange flex items-center gap-1.5">
                10만원 상당의 홍보 광고 집행
                <span className="text-[10px] bg-sydeorange text-white px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-tighter">Event</span>
              </h4>
              <p className="text-[13px] text-gray-700 font-medium leading-normal">
                유저들이 당신의 서비스를 더 많이 알릴 수 있도록, 10만원 상당의 유료 홍보 광고를 SYDE에서 직접 집행해 드립니다.
              </p>
            </div>
          </div>

          <div className="mt-2 pt-6 border-t border-gray-100 text-center">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <TrendingUp size={14} className="text-sydeorange" />
              <span className="text-[13px] font-bold text-gray-900">선정 확률을 높이는 팁!</span>
            </div>
            <p className="text-[12px] text-gray-500 leading-snug">
              업보트를 많이 받는 것이 가장 중요합니다.<br />
              주변에 널리 공유하여 업보트를 독려해보세요!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
