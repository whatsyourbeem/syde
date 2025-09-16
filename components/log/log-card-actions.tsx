"use client";

import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { toggleLogBookmark } from "@/app/log/log-actions";

interface LogCardActionsProps {
  logId: string;
  currentUserId: string | null;
  likesCount: number;
  hasLiked: boolean;
  bookmarksCount: number;
  hasBookmarked: boolean;
  commentsCount: number;
  onLikeStatusChange: (newLikesCount: number, newHasLiked: boolean) => void;
  onBookmarkStatusChange: (newBookmarksCount: number, newHasBookmarked: boolean) => void;
}

function LogCardActionsBase({
  logId,
  currentUserId,
  likesCount,
  hasLiked,
  bookmarksCount,
  hasBookmarked,
  commentsCount,
  onLikeStatusChange,
  onBookmarkStatusChange,
}: LogCardActionsProps) {
  const router = useRouter();
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyUrl, setCopyUrl] = useState("");
  const { openLoginDialog } = useLoginDialog();

  const handleCommentClick = useCallback(() => {
    router.push(`/log/${logId}#comments`);
  }, [router, logId]);

  const handleLike = useCallback(async () => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }
    if (likeLoading) return;

    setLikeLoading(true);
    const newLikesCount = hasLiked ? likesCount - 1 : likesCount + 1;
    const newHasLiked = !hasLiked;
    onLikeStatusChange(newLikesCount, newHasLiked);

    const supabase = createClient();
    if (hasLiked) {
      const { error } = await supabase.from("log_likes").delete().eq("log_id", logId).eq("user_id", currentUserId);
      if (error) {
        toast.error("좋아요 취소 실패");
        onLikeStatusChange(likesCount, hasLiked); // Revert on error
      }
    } else {
      const { error } = await supabase.from("log_likes").insert({ log_id: logId, user_id: currentUserId });
      if (error) {
        toast.error("좋아요 실패");
        onLikeStatusChange(likesCount, hasLiked); // Revert on error
      }
    }
    setLikeLoading(false);
  }, [currentUserId, logId, hasLiked, likesCount, likeLoading, openLoginDialog, onLikeStatusChange]);

  const handleBookmark = useCallback(async () => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }
    if (bookmarkLoading) return;

    setBookmarkLoading(true);
    const newBookmarksCount = hasBookmarked ? bookmarksCount - 1 : bookmarksCount + 1;
    const newHasBookmarked = !hasBookmarked;
    onBookmarkStatusChange(newBookmarksCount, newHasBookmarked);

    const result = await toggleLogBookmark(logId, hasBookmarked);
    if ("error" in result && result.error) {
      toast.error(result.error.message);
      onBookmarkStatusChange(bookmarksCount, hasBookmarked); // Revert on error
    }
    setBookmarkLoading(false);
  }, [currentUserId, logId, hasBookmarked, bookmarksCount, bookmarkLoading, openLoginDialog, onBookmarkStatusChange]);

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

  const commentButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleCommentClick}
          className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-green-100 hover:text-green-500 dark:hover:bg-green-900/20"
        >
          <MessageCircle size={18} />
          <span>{commentsCount}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>댓글</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <>
      <div className="flex justify-between items-center text-xs md:text-sm text-muted-foreground px-[44px] pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLike}
                disabled={likeLoading}
                className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-red-100 dark:hover:bg-red-900/20 group disabled:opacity-50"
              >
                {likeLoading ? (
                  <LoadingSpinner size="sm" className="text-red-500" />
                ) : (
                  <HeartIcon
                    className={
                      hasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-red-500"
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
          
          {commentButton}

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
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-yellow-100 dark:hover:bg-yellow-900/20 group disabled:opacity-50"
              >
                {bookmarkLoading ? (
                  <LoadingSpinner size="sm" className="text-yellow-500" />
                ) : (
                  <Bookmark
                    className={
                      hasBookmarked ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground group-hover:text-yellow-500"
                    }
                    size={18}
                  />
                )}
                <span className="group-hover:text-yellow-500">{bookmarksCount}</span>
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
    prevProps.bookmarksCount === nextProps.bookmarksCount &&
    prevProps.hasBookmarked === nextProps.hasBookmarked &&
    prevProps.commentsCount === nextProps.commentsCount
  );
});

LogCardActions.displayName = 'LogCardActions';