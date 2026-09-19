"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, Check, Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const READING_CHARS_PER_MINUTE = 500;

interface EditorWriteBarProps {
  pageLabel: string;
  lastSavedAt: number | null;
  onExit: () => void;
  onPreview: () => void;
  onPublish: () => void;
  publishLabel: string;
  busyLabel: string | null;
  /** Optional body size, shown as "1,234자 · 약 3분" next to the save state. */
  stats?: { characters: number };
  /**
   * Negative margin to bleed edge-to-edge past the page's own side padding, e.g. "-mx-4 md:-mx-6"
   * for a page padded with "px-4 md:px-6". Omit when the page container has no side padding to cancel.
   */
  bleedClassName?: string;
}

/**
 * Sticky bar for a writing page (insight, showcase, ...): keeps exit, save status, preview and the
 * publish action in reach while the writer is deep in a long form, and looks the same everywhere.
 */
export function EditorWriteBar({ pageLabel, lastSavedAt, onExit, onPreview, onPublish, publishLabel, busyLabel, stats, bleedClassName }: EditorWriteBarProps) {
  const ref = useRef<HTMLDivElement>(null);

  // The editor toolbar sticks right below this bar; publish our height so it doesn't slide underneath.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--editor-bar-height", `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--editor-bar-height");
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("sticky top-[var(--sticky-nav-height,0px)] z-40 border-b bg-background", bleedClassName)}
    >
      <div className="flex h-12 md:h-14 items-center gap-2 px-2 md:px-4">
        <Button type="button" variant="ghost" size="sm" onClick={onExit} className="h-9 md:h-10 gap-0.5 px-2 text-[#555]">
          <ChevronLeft size={18} />
          <span className="text-[14px]">나가기</span>
        </Button>
        <h1 className="truncate text-[14px] font-semibold text-sydeblue">{pageLabel}</h1>

        <div className="ml-auto flex items-center gap-3">
          {stats && stats.characters > 0 && (
            <span className="hidden md:inline text-[12px] text-[#888] tabular-nums">
              {stats.characters.toLocaleString("ko-KR")}자 · 약 {Math.max(1, Math.round(stats.characters / READING_CHARS_PER_MINUTE))}분
            </span>
          )}
          <span className="hidden sm:flex items-center gap-1 text-[12px] text-[#888]" aria-live="polite">
            {lastSavedAt ? (
              <>
                <Check size={13} className="text-emerald-600" />
                이 기기에 저장됨 {format(lastSavedAt, "HH:mm")}
              </>
            ) : (
              "작성 내용은 이 기기에 자동 저장돼요"
            )}
          </span>
          {/* Narrow screens: icon-only save state so the publish button keeps its room. */}
          <span
            className="sm:hidden flex items-center text-[12px] text-[#888]"
            aria-label={lastSavedAt ? `이 기기에 저장됨 ${format(lastSavedAt, "HH:mm")}` : "이 기기에 자동 저장"}
          >
            {lastSavedAt && (
              <>
                <Check size={13} className="text-emerald-600 mr-0.5" />
                {format(lastSavedAt, "HH:mm")}
              </>
            )}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={onPreview} className="h-9 md:h-10 gap-1 rounded-[10px] px-3 text-[14px]">
            <Eye size={15} />
            <span className="hidden sm:inline">미리보기</span>
          </Button>
          <Button
            type="button"
            onClick={onPublish}
            disabled={!!busyLabel}
            className="h-9 md:h-10 rounded-[10px] bg-sydeblue px-4 text-[14px] font-medium text-white hover:bg-sydeblue/90"
          >
            {busyLabel ? (
              <>
                <Loader2 size={15} className="mr-1 animate-spin" />
                {busyLabel}
              </>
            ) : (
              publishLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
