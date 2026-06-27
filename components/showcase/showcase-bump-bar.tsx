"use client";

import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUp, Clock } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { showcaseKeys } from "@/lib/queries/query-keys";
import { bumpShowcase } from "@/app/showcase/showcase-actions";
import { LoadingSpinner } from "@/components/ui/loading-states";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BUMP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

interface ShowcaseBumpBarProps {
  showcaseId: string;
  ownerId: string;
  currentUserId: string | null;
  bumpedAt: string | null;
  variant?: "default" | "featured";
}

/**
 * 쇼케이스 카드에서 본인 프로젝트를 게시판 최상단으로 끌어올리는 바.
 * 소유자에게만 노출되며, 마지막 끌어올리기(또는 생성)로부터 7일이 지나야 활성화된다.
 * 남은 시간은 항상 텍스트로 노출한다.
 */
function ShowcaseBumpBarBase({
  showcaseId,
  ownerId,
  currentUserId,
  bumpedAt,
  variant = "default",
}: ShowcaseBumpBarProps) {
  const isFeatured = variant === "featured";
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // 소유자에게만 노출
  if (!currentUserId || currentUserId !== ownerId) return null;

  // bumped_at은 NOT NULL이라 항상 존재해야 하지만, 누락 시 잘못 활성화되지 않도록 방어
  const bumpedTime = bumpedAt ? new Date(bumpedAt).getTime() : NaN;
  if (Number.isNaN(bumpedTime)) return null;

  const nextBumpMs = bumpedTime + BUMP_INTERVAL_MS;
  const remainingMs = nextBumpMs - Date.now();
  const canBump = remainingMs <= 0;

  // 남은 시간 텍스트
  let remainingLabel = "";
  if (!canBump) {
    const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    if (days > 1) {
      remainingLabel = `${days}일 후 끌어올릴 수 있어요`;
    } else {
      const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
      remainingLabel =
        hours > 1 ? `${hours}시간 후 끌어올릴 수 있어요` : "곧 끌어올릴 수 있어요";
    }
  }

  const handleBump = useCallback(async () => {
    if (loading || !canBump) return;
    setLoading(true);
    const result = await bumpShowcase(showcaseId);
    if (result.success) {
      toast.success("프로젝트를 끌어올렸어요!");
      // 쇼케이스 목록 캐시 무효화 + 상세 페이지 서버 데이터 갱신(남은 시간 텍스트 반영)
      queryClient.invalidateQueries({ queryKey: showcaseKeys.all });
      router.refresh();
    } else {
      toast.error(result.error.message || "끌어올리기에 실패했어요.");
    }
    setLoading(false);
  }, [loading, canBump, showcaseId, queryClient, router]);

  if (canBump) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={loading}
            className={cn(
              "flex items-center justify-center gap-1.5 w-full h-9 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60",
              isFeatured
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-sydeblue text-white hover:bg-sydeblue/90"
            )}
          >
            {loading ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <ChevronsUp size={18} strokeWidth={2} />
            )}
            끌어올리기
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트를 끌어올릴까요?</AlertDialogTitle>
            <AlertDialogDescription>
              끌어올리면 쇼케이스 게시판 최상단에 표시돼요.
              <br />
              다음 끌어올리기는 7일 후에 가능해요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBump}
              className="bg-sydeblue text-white hover:bg-sydeblue/90"
            >
              끌어올리기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5 w-full h-9 rounded-lg text-[13px] font-medium",
        isFeatured ? "bg-white/5 text-white/50" : "bg-gray-100 text-[#999999]"
      )}
    >
      <Clock size={16} strokeWidth={1.5} />
      {remainingLabel}
    </div>
  );
}

export const ShowcaseBumpBar = memo(ShowcaseBumpBarBase, (prev, next) => {
  return (
    prev.showcaseId === next.showcaseId &&
    prev.currentUserId === next.currentUserId &&
    prev.ownerId === next.ownerId &&
    prev.bumpedAt === next.bumpedAt
  );
});

ShowcaseBumpBar.displayName = "ShowcaseBumpBar";
