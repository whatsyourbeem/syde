"use client";

import { useState, memo, useCallback } from "react";
import { HeartIcon, MessageCircle, Share2, Bookmark, Link2, Copy } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useLoginDialog } from '@/context/LoginDialogContext';
import { LoadingSpinner } from "@/components/ui/loading-states";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LogCardActionsProps {
  logId: string;
  currentUserId: string | null;
  likesCount: number;
  hasLiked: boolean;
  commentsCount: number;
  showComments: boolean;
  onLikeStatusChange: (newLikesCount: number, newHasLiked: boolean) => void;
  onCommentsToggle: () => void;
}

function LogCardActionsBase({
  logId,
  currentUserId,
  likesCount,
  hasLiked,
  commentsCount,
  showComments,
  onLikeStatusChange,
  onCommentsToggle,
}: LogCardActionsProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyUrl, setCopyUrl] = useState("");
  const { openLoginDialog } = useLoginDialog();

  const handleLike = useCallback(async () => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }
    if (loading) return;

    setLoading(true);
    if (hasLiked) {
      const { error } = await supabase
        .from("log_likes")
        .delete()
        .eq("log_id", logId)
        .eq("user_id", currentUserId);

      if (!error) {
        onLikeStatusChange(likesCount - 1, false);
      } else {
        console.error("Error unliking log:", error);
      }
    } else {
      const { error } = await supabase
        .from("log_likes")
        .insert({ log_id: logId, user_id: currentUserId });

      if (!error) {
        onLikeStatusChange(likesCount + 1, true);
      } else {
        console.error("Error liking log:", error);
      }
    }
    setLoading(false);
  }, [currentUserId, logId, hasLiked, likesCount, loading, openLoginDialog, onLikeStatusChange, supabase]);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/log/${logId}`;
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
  }, [logId]);

  const handleShareAll = useCallback(async () => {
    const url = `${window.location.origin}/log/${logId}`;
    const text = "Check out this log on SYDE!";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SYDE Log",
          text: text,
          url: url,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error sharing:", error);
        }
      }
    } else {
      toast.info("Web Share is not supported on your browser.");
    }
  }, [logId]);

  return (
    <>
      <div className="flex justify-between items-center text-sm text-muted-foreground px-[44px] pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLike}
                disabled={loading}
                className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-red-100 dark:hover:bg-red-900/20 group disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="text-red-500" />
                ) : (
                  <HeartIcon
                    className={
                      hasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-red-500 group-hover:fill-red-500"
                    }
                    size={18}
                  />
                )}
                <span className="group-hover:text-red-500">{likesCount}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>좋아요</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onCommentsToggle}
                className={`flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-green-100 hover:text-green-500 dark:hover:bg-green-900/20 ${showComments ? 'text-green-500' : ''}`}>
                <MessageCircle size={18} />
                <span>{commentsCount}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>댓글</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-blue-100 hover:text-blue-500 dark:hover:bg-blue-900/20">
                    <Share2 size={18} />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>공유</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                <Link2 className="mr-2 h-4 w-4" />
                <span>링크 복사하기</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareAll} className="cursor-pointer">
                <span>모두 보기</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => console.log("Save button clicked!")}
                className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-yellow-100 hover:text-yellow-500 dark:hover:bg-yellow-900/20"
              >
                <Bookmark size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>저장</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

export const LogCardActions = memo(LogCardActionsBase, (prevProps, nextProps) => {
  return (
    prevProps.logId === nextProps.logId &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.likesCount === nextProps.likesCount &&
    prevProps.hasLiked === nextProps.hasLiked &&
    prevProps.commentsCount === nextProps.commentsCount &&
    prevProps.showComments === nextProps.showComments
  );
});

LogCardActions.displayName = 'LogCardActions';