"use client";

import { useState, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, MapPin, User, Users, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ActivityFeedItem,
  getActivityMessage,
  getActivityLink,
} from "@/lib/queries/feed-queries";
import { ensureSecureImageUrl } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { deleteActivity } from "@/app/log/activity-actions";

interface ActivityCardProps {
  activity: ActivityFeedItem;
  currentUserId: string | null;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

function ActivityCardBase({ activity, currentUserId }: ActivityCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteActivity(activity.id);
      if (result.success) {
        toast.success("활동이 삭제되었습니다.");
        // Invalidate the feed query to update the UI immediately
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        router.refresh();
      } else {
        toast.error(result.error?.message || "삭제 실패하였습니다.");
      }
    } catch (error) {
      console.error("Delete activity error:", error);
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };
  const profile = activity.profiles;
  const displayName = profile?.full_name || profile?.username || "알 수 없는 사용자";
  const avatarUrl = profile?.avatar_url || "/default_avatar.png";
  const message = getActivityMessage(activity, ""); // Pass empty for name to get the rest of the message
  const link = getActivityLink(activity);
  const details = activity.details;

  const renderPreview = () => {
    if (!details) return null;

    if (details.showcase) {
      const { showcase } = details;
      return (
        <div className="mt-3 flex gap-3 overflow-hidden border rounded-lg pr-3">
          {showcase.thumbnail_url && ensureSecureImageUrl(showcase.thumbnail_url) && (
            <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-l-md overflow-hidden bg-muted">
              <Image
                src={ensureSecureImageUrl(showcase.thumbnail_url)!}
                alt="Showcase thumbnail"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <h4 className="text-sm md:text-base font-semibold line-clamp-2 leading-tight">
              {showcase.title}
            </h4>
            {showcase.short_description && (
              <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-1 leading-snug">
                {showcase.short_description}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (details.insight) {
      const { insight } = details;
      return (
        <div className="mt-3 flex gap-3 overflow-hidden border rounded-lg pr-3">
          {insight.image_url && ensureSecureImageUrl(insight.image_url) && (
            <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-l-md overflow-hidden bg-muted">
              <Image
                src={ensureSecureImageUrl(insight.image_url)!}
                alt="Insight thumbnail"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <h4 className="text-sm md:text-base font-semibold line-clamp-2 leading-tight">
              {insight.title}
            </h4>
            <div className="flex flex-col">
              {insight.summary && (
                <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-1 leading-snug">
                  {insight.summary}
                </p>
              )}
              {insight.content_preview && (
                <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-1 leading-snug">
                  {insight.content_preview}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (details.meetup) {
      const { meetup } = details;
      return (
        <div className="mt-3 flex gap-3 overflow-hidden border rounded-lg pr-3">
          {meetup.thumbnail_url && ensureSecureImageUrl(meetup.thumbnail_url) && (
            <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-l-md overflow-hidden bg-muted">
              <Image
                src={ensureSecureImageUrl(meetup.thumbnail_url)!}
                alt="Meetup thumbnail"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <h4 className="text-sm md:text-base font-semibold line-clamp-2 leading-tight">
              {meetup.title}
            </h4>
            <div className="flex flex-col gap-0.5">
              {meetup.start_datetime && (
                <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground">
                  <Calendar size={13} className="shrink-0" />
                  <span>
                    {format(new Date(meetup.start_datetime), "M월 d일 (eee) a h:mm", { locale: ko })}
                  </span>
                </div>
              )}
              {meetup.location && (
                <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{meetup.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const content = (
    <div className="flex items-start gap-2 py-1 transition-all duration-200">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Image
          src={
            profile?.updated_at
              ? `${avatarUrl}?t=${new Date(profile.updated_at).getTime()}`
              : avatarUrl
          }
          alt={displayName}
          width={36}
          height={36}
          className="rounded-full object-cover border border-border/50"
          style={{ width: 36, height: 36 }}
        />
      </div>

      {/* Content Area: Message + Preview */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Row with Message and More Button */}
        <div className="flex justify-between items-start gap-2">
          {/* Message & Timestamp */}
          <p className="text-sm md:text-log-content text-foreground/90 leading-normal flex-1">
            <span className="font-bold">{displayName}</span>
            <span>{message}</span>
            <span className="ml-1.5 text-[11px] md:text-xs text-muted-foreground/70 whitespace-nowrap inline-block">
              · {formatTimeAgo(activity.created_at)}
            </span>
          </p>

          {/* More Actions (Only for owner) */}
          {currentUserId === activity.user_id && (
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="p-1 text-muted-foreground rounded-full hover:bg-secondary focus:outline-none transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-500 cursor-pointer focus:text-red-500"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>삭제</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>활동을 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          이 활동 피드 항목이 영구적으로 삭제됩니다. 원본 컨텐츠(쇼케이스, 인사이트, 모임)는 삭제되지 않습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        >
                          {isDeleting ? "삭제 중..." : "삭제"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Optional Preview Content */}
        {renderPreview()}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}

export const ActivityCard = memo(ActivityCardBase);
ActivityCard.displayName = "ActivityCard";
