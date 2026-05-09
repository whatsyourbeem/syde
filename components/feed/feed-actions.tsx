"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HeartIcon, Trash2, Edit } from "lucide-react";
import { Database } from "@/types/database.types";
import { deleteLog } from "@/app/feed/feed-actions"; // Import the server action
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
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
import { useLoginDialog } from "@/context/LoginDialogContext";

import { deleteLogLike, insertLogLike } from "@/lib/queries/log-queries";

interface FeedActionsProps {
  log: Database["public"]["Tables"]["logs"]["Row"];
  currentUserId: string | null;
  likesCount: number;
  hasLiked: boolean;
  onEditClick: () => void;
  onLikeStatusChange: (newLikesCount: number, newHasLiked: boolean) => void;
}

export function FeedActions({
  log,
  currentUserId,
  likesCount,
  hasLiked,
  onEditClick,
  onLikeStatusChange,
}: FeedActionsProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const { openLoginDialog } = useLoginDialog();

  const handleLike = async () => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }
    if (loading) return;

    setLoading(true);
    let newLikesCount = likesCount;
    let newHasLiked = hasLiked;

    try {
      if (hasLiked) {
        // Unlike
        await deleteLogLike(supabase, log.id, currentUserId);
        newLikesCount = likesCount - 1;
        newHasLiked = false;
      } else {
        // Like
        await insertLogLike(supabase, log.id, currentUserId);
        newLikesCount = likesCount + 1;
        newHasLiked = true;
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
    setLoading(false);
    onLikeStatusChange(newLikesCount, newHasLiked); // Notify parent of change
  };

  const handleDelete = async () => {
    if (currentUserId !== log.user_id) return;

    setIsDeleting(true);
    try {
      const result = await deleteLog(log.id);
      if (result.success) {
        toast.success("피드가 삭제되었습니다.");
        queryClient.invalidateQueries({ queryKey: ["logs"] });
      } else {
        toast.error(result.error.message || "피드 삭제에 실패했습니다.");
      }
    } catch {
      toast.error("피드 삭제 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
      <button
        onClick={handleLike}
        disabled={isDeleting || loading}
        className="flex items-center gap-1 rounded-md p-2 -m-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        <HeartIcon
          className={
            hasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
          }
          size={18}
        />
        <span>{likesCount} Likes</span>
      </button>
      {currentUserId === log.user_id && (
        <div className="flex items-center gap-2">
          <button
            onClick={onEditClick}
            disabled={isDeleting}
            className="p-1 text-muted-foreground hover:text-blue-500 disabled:opacity-50"
            aria-label="Edit feed"
          >
            <Edit size={16} />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={isDeleting}
                className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-50"
                aria-label="Delete feed"
              >
                <Trash2 size={16} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 이 피드를 영구적으로 삭제하고
                  스토리지에서 관련 이미지도 함께 삭제합니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "삭제 중..." : "삭제"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
