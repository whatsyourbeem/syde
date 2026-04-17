"use client";

import Image from "next/image";
import { formatSydePickDate, formatSydePickDateKR, cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SydePickBadgeProps {
  awards: Array<{ date: string; type: string }>;
  className?: string;
  size?: number;
}

function SydePickContent({ awards, isDialog = false }: { awards: Array<{ date: string; type: string }>; isDialog?: boolean }) {
  // Filter for sydepick type and sort by date descending
  const sydePicks = awards
    .filter(a => a.type === 'SYDE_PICK')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sydePicks.length === 0) return null;

  return (
    <div className={cn(
      "flex items-start",
      isDialog ? "gap-4 px-7 py-6" : "gap-2.5 px-4 py-3"
    )}>
      <Image
        src="/sydepick.png"
        alt="SYDE Pick Icon"
        width={isDialog ? 44 : 30}
        height={isDialog ? 44 : 30}
        className="object-contain mt-0.5"
      />
      <div className="flex flex-col items-start gap-1">
        <span className={cn(
          "font-['Pretendard'] font-extrabold text-[#ED6D34] leading-tight",
          isDialog ? "text-[20px]" : "text-[15px]"
        )}>
          SYDE Pick
        </span>
        <div className="flex flex-col items-start gap-0.5">
          {sydePicks.map((pick, index) => (
            <span key={index} className={cn(
              "font-['Pretendard'] font-medium text-[#777777] leading-tight",
              isDialog ? "text-[13px]" : "text-[11px]"
            )}>
              {formatSydePickDateKR(pick.date)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SydePickBadge({ awards, className, size = 30 }: SydePickBadgeProps) {
  // Only show if there's at least one sydepick
  const hasSydePick = awards.some(a => a.type === 'SYDE_PICK');
  if (!hasSydePick) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <div 
                className={`cursor-pointer shrink-0 ${className}`}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                <div 
                  className="relative" 
                  style={{ width: `${size}px`, height: `${size}px` }}
                >
                  <Image
                    src="/sydepick.png"
                    alt="SYDE Pick"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="p-0 bg-white border-[#ED6D34] shadow-md overflow-hidden"
          >
            <SydePickContent awards={awards} />
          </TooltipContent>
        </Tooltip>
        
        <DialogContent 
          className="w-fit max-w-[90vw] p-0 bg-white border-[#ED6D34] shadow-lg rounded-xl overflow-hidden sm:max-w-none outline-none focus:outline-none" 
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">SYDE Pick 정보</DialogTitle>
          <DialogDescription className="sr-only">
            선정된 날짜와 SYDE Pick 정보를 확인합니다.
          </DialogDescription>
          <SydePickContent awards={awards} isDialog={true} />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
