"use client";

import Image from "next/image";
import Link from "next/link";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
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

export function LogCardHeader({ log, currentUserId, onDelete, loading }: LogCardHeaderProps) {
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
            <Link href={`/${log.profiles?.username || log.user_id}`}>
              <Image
                src={avatarUrlWithCacheBuster}
                alt={`${log.profiles?.username || "User"}'s avatar`}
                width={36}
                height={36}
                className="rounded-full object-cover aspect-square mr-2"
              />
            </Link>
          )}
          <div className="flex-grow">
            <div className="flex items-baseline gap-1">
              <Link href={`/${log.profiles?.username || log.user_id}`}>
                <p className="font-semibold hover:underline text-log-content">
                  {log.profiles?.full_name ||
                    log.profiles?.username ||
                    "Anonymous"}
                </p>
              </Link>
              {log.profiles?.tagline && (
                <p className="text-xs text-muted-foreground">{log.profiles.tagline}</p>
              )}
              <p className="text-xs text-muted-foreground">·&nbsp;&nbsp;{formattedLogDate}</p>
            </div>
          </div>
        </div>
      </ProfileHoverCard>
      
      <div className="flex items-center gap-2">
        {currentUserId === log.user_id && (
          <AlertDialog>
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
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>삭제</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
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
        )}
      </div>
    </div>
  );
}