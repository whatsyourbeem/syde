"use client";

import { useMemo } from "react";
import { JSONContent } from "@tiptap/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import RichContent from "@/components/common/rich-content";
import { getInitialHtmlFromTiptap } from "@/components/common/tiptap-server-extensions";

interface EditorPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** One-line subtitle shown under the title (blog post's summary, showcase's tagline, ...). */
  subtitle?: string;
  imageUrl?: string | null;
  content: JSONContent | string;
  /** Heading shown above the rendered body, e.g. showcase's "소개" section label. Omit for a bare body. */
  contentLabel?: string;
}

/**
 * Shows a post/project the way a reader will actually see it — same server-HTML renderer as the
 * published page — so a writer can catch layout surprises (e.g. a blank line that collapses,
 * a table that overflows) before publishing rather than after. Shared by every "write" form.
 */
export function EditorPreviewDialog({ open, onOpenChange, title, subtitle, imageUrl, content, contentLabel }: EditorPreviewDialogProps) {
  // Recomputing on every keystroke would be wasted work; only render while the dialog is open.
  const html = useMemo(() => (open ? getInitialHtmlFromTiptap(content) : ""), [open, content]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <DialogTitle className="sr-only">미리보기</DialogTitle>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="aspect-video w-full rounded-t-lg object-cover" />
        )}
        <div className="px-6 py-8 md:px-10">
          <h1 className="text-[26px] font-bold leading-[1.3] text-black md:text-[36px]">
            {title.trim() || "제목 없음"}
          </h1>
          {subtitle?.trim() && <p className="mt-2 text-[15px] leading-[150%] text-[#777777] md:text-[16px]">{subtitle}</p>}
          <div className="mt-8 border-t border-[#E5E5E5] pt-8">
            {contentLabel && (
              <div className="mb-4 flex items-center gap-2">
                <div className="h-1 w-6 shrink-0 rounded-full bg-sydeorange" />
                <span className="text-[16px] font-bold text-sydeblue">{contentLabel}</span>
              </div>
            )}
            <RichContent html={html} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
