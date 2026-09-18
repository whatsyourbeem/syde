"use client";

import { FileClock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DraftRestoreBannerProps {
  savedAt: number;
  /** Short identifying text for the draft (e.g. its title), shown so the writer knows which draft this is. */
  preview?: string | null;
  onDiscard: () => void;
  onRestore: () => void;
  className?: string;
}

/**
 * Offers a locally-saved draft found on mount. Shared across every editor that uses `useLocalDraft`
 * (insight, showcase, club, meetup, bio) so the recovery experience looks the same everywhere.
 */
export function DraftRestoreBanner({ savedAt, preview, onDiscard, onRestore, className }: DraftRestoreBannerProps) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 rounded-[10px] border border-sydeblue/20 bg-sydeblue/5 p-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-2 text-[14px] text-sydeblue">
        <FileClock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          작성 중이던 내용이 있어요
          <span className="text-[#777777]">
            {" "}· {formatDistanceToNow(savedAt, { addSuffix: true, locale: ko })} 저장
            {preview && ` · "${preview}"`}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 gap-2 self-end md:self-auto">
        <Button variant="ghost" size="sm" className="text-[#777777]" onClick={onDiscard}>
          버리기
        </Button>
        <Button size="sm" className="bg-sydeblue hover:bg-sydeblue/90 text-white" onClick={onRestore}>
          이어서 쓰기
        </Button>
      </div>
    </div>
  );
}
