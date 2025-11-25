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
import { ShowcaseEditDialog } from "@/components/showcase/showcase-edit-dialog";
import { Database } from "@/types/database.types";
import { formatRelativeTime } from "@/lib/utils";
import { CertifiedBadge } from "@/components/ui/certified-badge";

interface ShowcaseCardHeaderProps {
  showcase: Database['public']['Tables']['showcases']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row'] | null;
  };
  currentUserId: string | null;
  onDelete: () => void;
  loading: boolean;
}

function ShowcaseCardHeaderBase({ showcase, currentUserId, onDelete, loading }: ShowcaseCardHeaderProps) {
  const router = useRouter();

  const avatarUrlWithCacheBuster = showcase.profiles?.avatar_url
    ? `${showcase.profiles.avatar_url}?t=${showcase.profiles.updated_at ? new Date(showcase.profiles.updated_at).getTime() : ''}`
    : null;

  const formattedShowcaseDate = showcase.created_at ? formatRelativeTime(showcase.created_at) : '';

  return (
    <div className="flex items-start justify-between">
      <ProfileHoverCard userId={showcase.user_id} profileData={showcase.profiles}>
        <div className="flex items-start">
          {avatarUrlWithCacheBuster && (
            <Link href={`/${showcase.profiles?.username || showcase.user_id}`} className="flex-shrink-0">
              <Image
                src={avatarUrlWithCacheBuster}
                alt={`${showcase.profiles?.username || "User"}'s avatar`}
                width={36}
                height={36}
                className="rounded-full object-cover mr-2"
                style={{ aspectRatio: '1' }}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYwZjAiLz4KPC9zdmc+"
              />
            </Link>
          )}
          <div className="flex-grow min-w-0 overflow-hidden">
            <div className="flex items-baseline gap-1 overflow-hidden">
              <Link href={`/${showcase.profiles?.username || showcase.user_id}`} className="flex-shrink-0">
                <div className="flex items-center gap-1">
                  <p className="font-semibold hover:underline text-sm md:text-showcase-content">
                    {showcase.profiles?.full_name ||
                      showcase.profiles?.username ||
                      "Anonymous"}
                  </p>
                  {showcase.profiles?.certified && <CertifiedBadge size="sm" />}
                </div>
              </Link>
              {showcase.profiles?.tagline && (
                <p className="text-xs text-muted-foreground flex-grow min-w-0 truncate">{showcase.profiles.tagline}</p>
              )}
              <p className="text-xs text-muted-foreground flex-shrink-0">·&nbsp;&nbsp;{formattedShowcaseDate}</p>
            </div>
          </div>
        </div>
      </ProfileHoverCard>
      
      <div className="flex items-center gap-2">
        {currentUserId === showcase.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-muted-foreground rounded-full hover:bg-secondary">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ShowcaseEditDialog
                userId={currentUserId}
                avatarUrl={showcase.profiles?.avatar_url || null}
                username={showcase.profiles?.username || null}
                full_name={showcase.profiles?.full_name || null}
                initialShowcaseData={showcase}
                onSuccess={() => router.refresh()}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  <span>수정</span>
                </DropdownMenuItem>
              </ShowcaseEditDialog>
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
                      이 작업은 되돌릴 수 없습니다. 이 쇼케이스를 영구적으로 삭제하고 스토리지에서 관련 이미지도 함께 삭제합니다.
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

export const ShowcaseCardHeader = memo(ShowcaseCardHeaderBase, (prevProps, nextProps) => {
  return (
    prevProps.showcase.id === nextProps.showcase.id &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.loading === nextProps.loading &&
    JSON.stringify(prevProps.showcase.profiles) === JSON.stringify(nextProps.showcase.profiles)
  );
});

ShowcaseCardHeader.displayName = 'ShowcaseCardHeader';