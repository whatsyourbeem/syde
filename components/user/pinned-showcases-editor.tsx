"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowUpCircle, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { fetchShowcasesAction } from "@/app/showcase/showcase-data-actions";
import { updatePinnedShowcases } from "@/app/[username]/pinned-showcases-actions";
import { ShowcaseThumbnail } from "@/components/showcase/showcase-thumbnail";
import { cn } from "@/lib/utils";
import { OptimizedShowcase } from "@/lib/queries/showcase-queries";

const MAX_PINNED = 3;

interface PinnedShowcasesEditorProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPinnedIds: string[];
  onSaved: (showcases: OptimizedShowcase[]) => void;
}

export function PinnedShowcasesEditor({
  userId,
  open,
  onOpenChange,
  currentPinnedIds,
  onSaved,
}: PinnedShowcasesEditorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(currentPinnedIds);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedIds(currentPinnedIds);
    }
  }, [open, currentPinnedIds]);

  const { data, isLoading } = useQuery({
    queryKey: ["own-showcases-for-pin", userId],
    queryFn: () =>
      fetchShowcasesAction({
        currentUserId: userId,
        showcasesPerPage: 50,
        filterByParticipantUserId: userId,
      }),
    enabled: open,
  });

  const ownShowcases = data?.showcases || [];

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }
      if (prev.length >= MAX_PINNED) {
        toast.error(`대표 프로젝트는 최대 ${MAX_PINNED}개까지 고정할 수 있어요.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updatePinnedShowcases(selectedIds);
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error || "저장에 실패했어요.");
      return;
    }

    const byId = new Map(ownShowcases.map((s) => [s.id, s]));
    onSaved(selectedIds.map((id) => byId.get(id)).filter((s): s is OptimizedShowcase => !!s));
    toast.success("대표 프로젝트를 저장했어요!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>대표 프로젝트 편집 ({selectedIds.length}/{MAX_PINNED})</DialogTitle>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto flex flex-col gap-2 my-4 px-0.5 py-0.5">
          {isLoading && (
            <p className="text-sm text-[#777777] py-4 text-center">불러오는 중...</p>
          )}
          {!isLoading && ownShowcases.length === 0 && (
            <p className="text-sm text-[#777777] py-4 text-center">
              등록된 쇼케이스가 없어요.
            </p>
          )}
          {ownShowcases.map((showcase) => {
            const isSelected = selectedIds.includes(showcase.id);
            return (
              <label
                key={showcase.id}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggle(showcase.id)}
                />
                {/* 프로필 "대표 프로젝트" 섹션의 모바일 카드와 동일한 디자인 */}
                <div
                  className={cn(
                    "flex flex-1 min-w-0 flex-row items-stretch rounded-xl border overflow-hidden transition-all",
                    isSelected
                      ? "border-sydeblue"
                      : "border-[#F1F1F1] hover:border-[#B7B7B7] hover:shadow-sm"
                  )}
                >
                  <ShowcaseThumbnail
                    src={showcase.thumbnail_url}
                    alt={showcase.name || ""}
                    containerClassName="w-20 shrink-0"
                    status={showcase.status}
                    statusSize="sm"
                  />
                  <div className="flex flex-col gap-0.5 min-w-0 justify-center p-3">
                    <span className="text-base font-bold text-black line-clamp-1">
                      {showcase.name}
                    </span>
                    <span className="text-[11px] text-[#777777] line-clamp-1">
                      {showcase.short_description}
                    </span>
                    <span className="flex items-center gap-2 text-[11px] text-[#777777]">
                      <span className="inline-flex items-center gap-0.5">
                        <Eye size={13} strokeWidth={1.5} />
                        {showcase.views_count || 0}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <ArrowUpCircle size={13} strokeWidth={1.5} />
                        {showcase.upvotesCount}
                      </span>
                    </span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
