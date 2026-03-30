"use client";

import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpCircle,
  MessageCircle,
  Share,
  Eye,
  Link2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatNumber } from "@/lib/utils";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { LoadingSpinner } from "@/components/ui/loading-states";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShowcaseCardActionsProps {
  showcaseId: string;
  currentUserId: string | null;
  upvotesCount: number;
  hasUpvoted: boolean;
  commentsCount: number;
  viewsCount: number;
  onUpvoteStatusChange: (newUpvotesCount: number, newHasUpvoted: boolean) => void;
}

function ShowcaseCardActionsBase({
  showcaseId,
  currentUserId,
  upvotesCount,
  hasUpvoted,
  commentsCount,
  viewsCount,
  onUpvoteStatusChange,
}: ShowcaseCardActionsProps) {
  const router = useRouter();
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyUrl, setCopyUrl] = useState("");
  const { openLoginDialog } = useLoginDialog();

  const handleCommentClick = useCallback(() => {
    router.push(`/showcase/${showcaseId}#comments`);
  }, [router, showcaseId]);

  const handleUpvote = useCallback(async () => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }
    if (upvoteLoading) return;

    setUpvoteLoading(true);
    const newUpvotesCount = hasUpvoted ? upvotesCount - 1 : upvotesCount + 1;
    const newHasUpvoted = !hasUpvoted;
    onUpvoteStatusChange(newUpvotesCount, newHasUpvoted);

    const supabase = createClient();
    if (hasUpvoted) {
      const { error } = await supabase
        .from("showcase_upvotes")
        .delete()
        .eq("showcase_id", showcaseId)
        .eq("user_id", currentUserId);
      if (error) {
        toast.error("업보트 취소 실패");
        onUpvoteStatusChange(upvotesCount, hasUpvoted); // Revert on error
      }
    } else {
      const { error } = await supabase
        .from("showcase_upvotes")
        .insert({ showcase_id: showcaseId, user_id: currentUserId });
      if (error) {
        toast.error("업보트 실패");
        onUpvoteStatusChange(upvotesCount, hasUpvoted); // Revert on error
      }
    }
    setUpvoteLoading(false);
  }, [
    currentUserId,
    showcaseId,
    hasUpvoted,
    upvotesCount,
    upvoteLoading,
    openLoginDialog,
    onUpvoteStatusChange,
  ]);



  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/showcase/${showcaseId}`;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("링크를 복사했어요!");
      } catch {
        setCopyUrl(url);
        setShowCopyDialog(true);
      }
    } else {
      setCopyUrl(url);
      setShowCopyDialog(true);
    }
  }, [showcaseId]);

  const handleShareAll = useCallback(async () => {
    const url = `${window.location.origin}/showcase/${showcaseId}`;
    const text = "Check out this showcase on SYDE!";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SYDE Showcase",
          text: text,
          url: url,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      toast.info("Web Share is not supported on your browser.");
    }
  }, [showcaseId]);

  return (
    <>
    <div className="flex flex-row justify-between md:justify-start items-center pt-1 px-3 md:px-0 md:gap-[50px] w-full h-[28px] text-[#777777]">
      {/* Views */}
      <div className="flex items-center gap-[5px]">
        <Eye size={18} strokeWidth={1.5} className="text-[#777777]" />
        <span className="text-[13px] leading-[150%] h-[21px] text-[#777777]">
          {formatNumber(viewsCount)}
        </span>
      </div>

      {/* Upvote */}
      <button
        onClick={handleUpvote}
        disabled={upvoteLoading}
        className="flex items-center gap-[5px] transition-colors hover:text-sydeorange disabled:opacity-50"
      >
        {upvoteLoading ? (
          <LoadingSpinner size="sm" className="text-sydeorange" />
        ) : (
          <ArrowUpCircle
            className={hasUpvoted ? "fill-sydeorange text-white" : ""}
            size={18}
            strokeWidth={1.5}
          />
        )}
        <span
          className={`text-[13px] leading-[150%] h-[21px] ${hasUpvoted ? "text-sydeorange font-semibold" : ""}`}
        >
          {formatNumber(upvotesCount)}
        </span>
      </button>

      {/* Comment */}
      <button
        onClick={handleCommentClick}
        className="flex items-center gap-[5px] transition-colors hover:text-green-500"
      >
        <MessageCircle size={18} strokeWidth={1.5} />
        <span className="text-[13px] leading-[150%] h-[21px]">
          {formatNumber(commentsCount)}
        </span>
      </button>

      {/* Share */}
      <button
        onClick={handleCopyLink}
        className="flex items-center transition-colors hover:text-blue-500"
      >
        <Share size={18} strokeWidth={1.5} />
      </button>


    </div>

      <AlertDialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <AlertDialogContent className="w-[350px] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>링크 복사</AlertDialogTitle>
            <AlertDialogDescription>
              자동 복사를 지원하지 않는 환경입니다. 수동으로 복사해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={copyUrl}
              className="w-full p-2 border rounded bg-muted text-muted-foreground flex-grow"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={async () => {
                if (navigator.clipboard && window.isSecureContext) {
                  try {
                    await navigator.clipboard.writeText(copyUrl);
                    toast.success("링크를 복사했어요!");
                  } catch {
                    toast.error("복사에 실패했어요. 수동으로 복사해주세요.");
                  }
                } else {
                  toast.error("브라우저에서 클립보드 복사를 지원하지 않아요.");
                }
              }}
              className="p-2 rounded-md hover:bg-secondary"
              aria-label="Copy link"
            >
              <Copy size={18} />
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowCopyDialog(false)}>
              닫기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const ShowcaseCardActions = memo(
  ShowcaseCardActionsBase,
  (prevProps, nextProps) => {
    return (
      prevProps.showcaseId === nextProps.showcaseId &&
      prevProps.currentUserId === nextProps.currentUserId &&
      prevProps.upvotesCount === nextProps.upvotesCount &&
      prevProps.hasUpvoted === nextProps.hasUpvoted &&
      prevProps.commentsCount === nextProps.commentsCount &&
      prevProps.viewsCount === nextProps.viewsCount
    );
  },
);

ShowcaseCardActions.displayName = "ShowcaseCardActions";
