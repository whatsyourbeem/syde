"use client";

import { useRef } from "react";
import { Check, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface InsightPublishSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  /** Images found in the body, offered as cover candidates. */
  imageCandidates: string[];
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  onUploadImage: (file: File) => Promise<void>;
  uploading: boolean;
  summary: string;
  onSummaryChange: (summary: string) => void;
  /** Auto-generated one-liner, previewed while the field is empty. */
  summaryPlaceholder: string;
  submitting: boolean;
  onConfirm: () => void;
}

interface SheetBodyProps extends InsightPublishSheetProps {
  layout: "dialog" | "drawer";
}

function SheetBody({
  isEditMode,
  imageCandidates,
  imageUrl,
  onImageUrlChange,
  onUploadImage,
  uploading,
  summary,
  onSummaryChange,
  summaryPlaceholder,
  layout,
}: SheetBodyProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // A cover uploaded directly isn't in the body, so it needs its own tile to stay visible and selectable.
  const tiles = imageUrl && !imageCandidates.includes(imageUrl) ? [imageUrl, ...imageCandidates] : imageCandidates;

  return (
    <div className={cn("flex flex-col gap-6", layout === "drawer" && "overflow-y-auto px-4 pb-2")}>
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-medium text-sydeblue">
            대표 이미지 <span className="font-normal text-[#999999]">(선택)</span>
          </h3>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) await onUploadImage(file);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-1 px-2 text-[13px] text-sydeblue"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            직접 올리기
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onImageUrlChange("")}
            aria-pressed={!imageUrl}
            className={cn(
              "flex aspect-square min-h-[80px] items-center justify-center rounded-[10px] border text-[13px] transition-colors",
              !imageUrl ? "border-sydeblue bg-sydeblue/5 text-sydeblue" : "border-[#E5E5E5] text-[#777]",
            )}
          >
            없음
          </button>
          {tiles.map((src) => {
            const selected = src === imageUrl;
            return (
              <button
                key={src}
                type="button"
                onClick={() => onImageUrlChange(src)}
                aria-pressed={selected}
                aria-label="대표 이미지로 선택"
                className={cn(
                  "relative aspect-square overflow-hidden rounded-[10px] border-2 transition-colors",
                  selected ? "border-sydeblue" : "border-transparent",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                {selected && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sydeblue text-white">
                    <Check size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {imageCandidates.length === 0 && !imageUrl && (
          <p className="text-[12px] text-[#999999]">본문에 이미지를 넣으면 여기서 고를 수 있어요.</p>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <label htmlFor="insight-summary" className="text-[14px] font-medium text-sydeblue">
          한 줄 소개 <span className="font-normal text-[#999999]">(선택)</span>
        </label>
        <input
          id="insight-summary"
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          maxLength={200}
          placeholder={summaryPlaceholder || "비워두면 본문 앞부분이 들어가요"}
          className="h-11 w-full rounded-[10px] border-[0.5px] border-[#B7B7B7] bg-transparent px-3 text-[16px] outline-none transition-all placeholder:text-[#999] focus:ring-1 focus:ring-sydeblue md:text-[14px]"
        />
        <p className="text-[12px] text-[#999999]">
          {isEditMode ? "목록 카드와 공유 미리보기에 보여요." : "비워두면 본문 앞부분으로 자동 채워져요."}
        </p>
      </section>
    </div>
  );
}

/** Publish step: everything optional about a post lives here so the writing screen stays just title + body. */
export function InsightPublishSheet(props: InsightPublishSheetProps) {
  const { open, onOpenChange, isEditMode, uploading, submitting, onConfirm } = props;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const confirmLabel = isEditMode ? "수정하기" : "발행하기";
  const title = isEditMode ? "글 수정" : "발행 설정";
  const description = "대표 이미지와 한 줄 소개는 비워둬도 괜찮아요.";

  const confirmButton = (
    <Button
      type="button"
      onClick={onConfirm}
      disabled={submitting || uploading}
      className="h-11 rounded-[10px] bg-sydeblue px-6 text-[14px] font-medium text-white hover:bg-sydeblue/90"
    >
      {submitting ? (
        <>
          <Loader2 size={15} className="mr-1 animate-spin" />
          처리 중
        </>
      ) : (
        confirmLabel
      )}
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <SheetBody {...props} layout="dialog" />
          <DialogFooter>{confirmButton}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <SheetBody {...props} layout="drawer" />
        <DrawerFooter>{confirmButton}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
