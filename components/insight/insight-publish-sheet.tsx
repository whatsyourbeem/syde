"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, X } from "lucide-react";
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
import {
  INSIGHT_CATEGORIES,
  MAX_INSIGHT_TAGS,
  normalizeTags,
  type InsightCategory,
} from "@/lib/insight-categories";

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
  category: InsightCategory | null;
  onCategoryChange: (category: InsightCategory | null) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
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
  imageCandidates,
  imageUrl,
  onImageUrlChange,
  onUploadImage,
  uploading,
  category,
  onCategoryChange,
  tags,
  onTagsChange,
  summary,
  onSummaryChange,
  summaryPlaceholder,
  layout,
}: SheetBodyProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagDraft, setTagDraft] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const handOffFocusRef = useRef(false);

  // The tag input unmounts at the limit, which would drop focus onto the dialog itself; hand it to the next field.
  useEffect(() => {
    if (tags.length < MAX_INSIGHT_TAGS || !handOffFocusRef.current) return;
    handOffFocusRef.current = false;
    document.getElementById("insight-summary")?.focus();
  }, [tags.length]);

  // Commits whatever is typed as tags; a pasted "a, b" or a trailing comma adds several at once.
  const commitTags = (raw: string) => {
    const typed = raw.split(",");
    if (typed.every((part) => !part.trim())) return;
    const next = normalizeTags([...tags, ...typed]);
    if (next.length >= MAX_INSIGHT_TAGS && document.activeElement === tagInputRef.current) {
      handOffFocusRef.current = true;
    }
    onTagsChange(next);
    setTagDraft("");
  };
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

      <section className="flex flex-col gap-2">
        <h3 className="text-[14px] font-medium text-sydeblue">
          카테고리 <span className="font-normal text-[#999999]">(선택)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {INSIGHT_CATEGORIES.map(({ code, label }) => {
            const selected = category === code;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={selected}
                // Pressing the chosen chip again clears it: a category is never forced.
                onClick={() => onCategoryChange(selected ? null : code)}
                className={cn(
                  "h-10 rounded-full border px-4 text-[14px] transition-colors md:h-9",
                  selected
                    ? "border-sydeblue bg-sydeblue text-white"
                    : "border-[#E5E5E5] text-[#555] hover:bg-slate-50",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="insight-tags" className="text-[14px] font-medium text-sydeblue">
          태그 <span className="font-normal text-[#999999]">(선택, 최대 {MAX_INSIGHT_TAGS}개)</span>
        </label>
        <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[10px] border-[0.5px] border-[#B7B7B7] px-2 py-1.5 transition-all focus-within:ring-1 focus-within:ring-sydeblue">
          {tags.map((tag) => (
            <span key={tag} className="flex h-8 items-center gap-1 rounded-full bg-sydeblue/10 pl-3 pr-1.5 text-[13px] text-sydeblue">
              #{tag}
              <button
                type="button"
                aria-label={`${tag} 태그 삭제`}
                onClick={() => onTagsChange(tags.filter((t) => t !== tag))}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-sydeblue/10"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {tags.length < MAX_INSIGHT_TAGS && (
            <input
              id="insight-tags"
              ref={tagInputRef}
              value={tagDraft}
              onChange={(e) => {
                // A comma ends the tag, like Enter.
                if (e.target.value.includes(",")) commitTags(e.target.value);
                else setTagDraft(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitTags(tagDraft);
                } else if (e.key === "Backspace" && !tagDraft && tags.length > 0) {
                  onTagsChange(tags.slice(0, -1));
                }
              }}
              onBlur={() => commitTags(tagDraft)}
              placeholder={tags.length === 0 ? "Enter로 태그 추가" : ""}
              className="h-8 min-w-[120px] flex-1 bg-transparent px-1 text-[16px] outline-none placeholder:text-[#999] md:text-[14px]"
            />
          )}
        </div>
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
        <p className="text-[12px] text-[#999999]">비워두면 본문 앞부분으로 채워져요.</p>
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
