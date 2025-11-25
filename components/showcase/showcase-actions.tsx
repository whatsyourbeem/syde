"use client";

import { useState } from "react";
import { HeartIcon, Trash2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { Database } from "@/types/database.types";
import { deleteShowcase } from "@/app/showcase/showcase-actions"; // Import the server action
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

interface ShowcaseActionsProps {
  showcase: Database["public"]["Tables"]["showcases"]["Row"];
  currentUserId: string | null;
  likesCount: number;
  hasLiked: boolean;
  onEditClick: () => void;
  onLikeStatusChange: (newLikesCount: number, newHasLiked: boolean) => void;
}

export function ShowcaseActions({
  showcase,
  currentUserId,
  likesCount,
  hasLiked,
  onEditClick,
  onLikeStatusChange,
}: ShowcaseActionsProps) {
  const supabase = createClient();
  const router = useRouter();
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

    if (hasLiked) {
      // Unlike
      const { error } = await supabase
        .from("showcase_likes")
        .delete()
        .eq("showcase_id", showcase.id)
        .eq("user_id", currentUserId);

      if (!error) {
        newLikesCount = likesCount - 1;
        newHasLiked = false;
      } else {
        console.error("Error unliking showcase:", error);
      }
    } else {
      // Like
      const { error } = await supabase
        .from("showcase_likes")
        .insert({ showcase_id: showcase.id, user_id: currentUserId });

      if (!error) {
        newLikesCount = likesCount + 1;
        newHasLiked = true;
      } else {
        console.error("Error liking showcase:", error);
      }
    }
    setLoading(false);
    onLikeStatusChange(newLikesCount, newHasLiked); // Notify parent of change
  };

  const handleDelete = async () => {
    if (currentUserId !== showcase.user_id) return;

    setIsDeleting(true);
    try {
      const result = await deleteShowcase(showcase.id);
      if (!result.success) {
        const errorMessage =
          result.error?.message || "쇼케이스 삭제에 실패했습니다.";
        toast.error("쇼케이스 삭제 실패", { description: errorMessage });
      } else {
        toast.success("쇼케이스가 삭제되었습니다.");
        // Redirect or refresh logic might be needed here,
        // but it's better handled by the parent component.
        router.push("/"); // Simple redirect to home for now
      }
    } catch {
      toast.error("쇼케이스 삭제 중 예기치 않은 오류가 발생했습니다.");
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
      {currentUserId === showcase.user_id && (
        <div className="flex items-center gap-2">
          <button
            onClick={onEditClick}
            disabled={isDeleting}
            className="p-1 text-muted-foreground hover:text-blue-500 disabled:opacity-50"
            aria-label="Edit showcase"
          >
            <Edit size={16} />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={isDeleting}
                className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-50"
                aria-label="Delete showcase"
              >
                <Trash2 size={16} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 이 쇼케이스를 영구적으로 삭제하고
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
