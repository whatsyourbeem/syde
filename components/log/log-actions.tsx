"use client";

import { useState } from 'react';
import { HeartIcon, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Database } from "@/types/database.types";
import { deleteLog } from '@/app/log/actions'; // Import the server action
import { toast } from 'sonner';
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

interface LogActionsProps {
  log: Database['public']['Tables']['logs']['Row'];
  currentUserId: string | null;
  likesCount: number;
  hasLiked: boolean;
  onEditClick: () => void;
  onLike: () => void;
}

export function LogActions({
  log,
  currentUserId,
  likesCount,
  hasLiked,
  onEditClick,
  onLike,
}: LogActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (currentUserId !== log.user_id) return;

    setIsDeleting(true);
    try {
      const result = await deleteLog(log.id);
      if (result?.error) {
        toast.error('로그 삭제 실패', { description: result.error });
      } else {
        toast.success('로그가 삭제되었습니다.');
        // Redirect or refresh logic might be needed here, 
        // but it's better handled by the parent component.
        router.push('/'); // Simple redirect to home for now
      }
    } catch (error) {
      toast.error('로그 삭제 중 예기치 않은 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
      <button
        onClick={onLike}
        disabled={isDeleting}
        className="flex items-center gap-1 rounded-md p-2 -m-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        <HeartIcon
          className={hasLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}
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
            aria-label="Edit log"
          >
            <Edit size={16} />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={isDeleting}
                className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-50"
                aria-label="Delete log"
              >
                <Trash2 size={16} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 이 로그를 영구적으로 삭제하고 스토리지에서 관련 이미지도 함께 삭제합니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? '삭제 중...' : '삭제'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}