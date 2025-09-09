"use client";

import Image from "next/image";
import Link from "next/link";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo } from "react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { LogEditDialog } from "@/components/log/log-edit-dialog";
import { Database } from "@/types/database.types";
import { formatRelativeTime } from "@/lib/utils";

interface LogCardHeaderProps {
  log: Database['public']['Tables']['logs']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row'] | null;
  };
  currentUserId: string | null;
  onDelete: () => void;
  loading: boolean;
}

function LogCardHeaderBase({ log, currentUserId, onDelete, loading }: LogCardHeaderProps) {
  const router = useRouter();

  const avatarUrlWithCacheBuster = log.profiles?.avatar_url
    ? `${log.profiles.avatar_url}?t=${log.profiles.updated_at ? new Date(log.profiles.updated_at).getTime() : ''}`
    : null;

  const formattedLogDate = log.created_at ? formatRelativeTime(log.created_at) : '';

  return (
    <div className="flex items-start justify-between">
      <ProfileHoverCard userId={log.user_id} profileData={log.profiles}>
        <div className="flex items-start">
          {avatarUrlWithCacheBuster && (
            <Link href={`/${log.profiles?.username || log.user_id}`} className="flex-shrink-0">
              <Image
                src={avatarUrlWithCacheBuster}
                alt={`${log.profiles?.username || "User"}'s avatar`}
                width={36}
                height={36}
                className="rounded-full object-cover aspect-square mr-2"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYwZjAiLz4KPC9zdmc+"
              />
            </Link>
          )}
          <div className="flex-grow min-w-0 overflow-hidden">
            <div className="flex items-baseline gap-1 overflow-hidden">
              <Link href={`/${log.profiles?.username || log.user_id}`} className="flex-shrink-0">
                <p className="font-semibold hover:underline text-log-content">
                  {log.profiles?.full_name ||
                    log.profiles?.username ||
                    "Anonymous"}
                </p>
              </Link>
              {log.profiles?.tagline && (
                <p className="text-xs text-muted-foreground flex-grow min-w-0 truncate">{log.profiles.tagline}</p>
              )}
              <p className="text-xs text-muted-foreground flex-shrink-0">·&nbsp;&nbsp;{formattedLogDate}</p>
            </div>
          </div>
        </div>
      </ProfileHoverCard>
      
      <div className="flex items-center gap-2">
        {currentUserId === log.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-muted-foreground rounded-full hover:bg-secondary">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <LogEditDialog
                userId={currentUserId}
                avatarUrl={log.profiles?.avatar_url || null}
                username={log.profiles?.username || null}
                full_name={log.profiles?.full_name || null}
                initialLogData={log}
                onSuccess={() => router.refresh()}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  <span>수정</span>
                </DropdownMenuItem>
              </LogEditDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>삭제</span>
                  </DropdownMenuItem>
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
                    <AlertDialogAction onClick={onDelete} disabled={loading}>
                      {loading ? '삭제 중...' : '삭제'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export const LogCardHeader = memo(LogCardHeaderBase, (prevProps, nextProps) => {
  return (
    prevProps.log.id === nextProps.log.id &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.loading === nextProps.loading &&
    JSON.stringify(prevProps.log.profiles) === JSON.stringify(nextProps.log.profiles)
  );
});

LogCardHeader.displayName = 'LogCardHeader';