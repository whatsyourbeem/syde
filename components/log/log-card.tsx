"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { HeartIcon, MessageCircle, Trash2, Edit, Share2, Bookmark, MoreHorizontal, Copy, Link2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useLoginDialog } from '@/context/LoginDialogContext';

import { toast } from "sonner";
import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";
import { Database } from "@/types/database.types";

import { useRouter } from "next/navigation";
import { linkifyMentions, formatRelativeTime } from "@/lib/utils";
import { OgPreviewCard } from "@/components/common/og-preview-card";
import { deleteLog } from "@/app/log/log-actions"; // Import the centralized server action

interface LogCardProps {
  log: Database['public']['Tables']['logs']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row'] | null;
    log_likes: Array<{ user_id: string }>;
    log_comments: Array<{ id: string }>;
  };
  currentUserId: string | null;
  initialLikesCount: number;
  initialHasLiked: boolean;
  initialCommentsCount: number;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  searchQuery?: string;
  isDetailPage?: boolean;
}

export function LogCard({
  log,
  currentUserId,
  initialLikesCount,
  initialHasLiked,
  initialCommentsCount,
  mentionedProfiles,
  searchQuery,
  isDetailPage = false,
}: LogCardProps) {
  const supabase = createClient();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const [showReadMore, setShowReadMore] = useState(false);
  const [imageStyle, setImageStyle] = useState<{
    width?: string;
    height?: string;
    aspectRatio?: string;
    objectFit: "cover" | "contain";
    margin?: string;
  } | null>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyUrl, setCopyUrl] = useState("");
  const [ogUrl, setOgUrl] = useState<string | null>(null);

  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = log.content.match(urlRegex);
    if (match) {
      setOgUrl(match[0]);
    }
  }, [log.content]);

  useEffect(() => {
    if (contentRef.current) {
      const maxHeight = 12 * 24;
      if (contentRef.current.scrollHeight > maxHeight) {
        setShowReadMore(true);
      } else {
        setShowReadMore(false);
      }
    }
  }, [log.content]);

  useEffect(() => {
    if (log.image_url) {
      const img = new window.Image();
      img.src = log.image_url;
      img.onload = () => {
        if (img.naturalHeight > 0) {
          const originalAspectRatio = img.naturalWidth / img.naturalHeight;
          const targetAspectRatio = 3 / 4;

          if (originalAspectRatio < targetAspectRatio) {
            setImageStyle({
              width: "300px",
              height: "400px",
              objectFit: "cover",
              margin: "0 auto",
            });
          } else {
            setImageStyle({
              aspectRatio: `${originalAspectRatio}`,
              objectFit: "contain",
            });
          }
        }
      };
      img.onerror = () => {
        setImageStyle(null);
      };
    } else {
      setImageStyle(null);
    }
  }, [log.image_url]);

  useEffect(() => {
    setLikesCount(initialLikesCount);
    setHasLiked(initialHasLiked);
    setCommentsCount(initialCommentsCount);
  }, [initialLikesCount, initialHasLiked, initialCommentsCount]);

  const avatarUrlWithCacheBuster = log.profiles?.avatar_url
    ? `${log.profiles.avatar_url}?t=${log.profiles.updated_at ? new Date(log.profiles.updated_at).getTime() : ''}`
    : null;

  const formattedLogDate = log.created_at ? formatRelativeTime(log.created_at) : '';

  const { openLoginDialog } = useLoginDialog();

  const handleLike = async () => {
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
        .eq("log_id", log.id)
        .eq("user_id", currentUserId);

      if (!error) {
        setLikesCount((prev) => prev - 1);
        setHasLiked(false);
      } else {
        console.error("Error unliking log:", error);
      }
    } else {
      const { error } = await supabase
        .from("log_likes")
        .insert({ log_id: log.id, user_id: currentUserId });

      if (!error) {
        setLikesCount((prev) => prev + 1);
        setHasLiked(true);
      } else {
        console.error("Error liking log:", error);
      }
    }
    setLoading(false);
  };

  const handleCommentAdded = () => {
    setCommentsCount((prev) => prev + 1);
    setShowComments(true);
  };

  const handleDelete = async () => {
    if (currentUserId !== log.user_id) return;
    setLoading(true);
    try {
      const result = await deleteLog(log.id);
      if (result?.error) {
        toast.error('로그 삭제 실패', { description: result.error });
      } else {
        toast.success('로그가 삭제되었습니다.');
        router.refresh(); // Refresh the page to reflect the deletion
      }
    } catch {
      toast.error('로그 삭제 중 예기치 않은 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/log/${log.id}`;
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
  };

  const handleShareAll = async () => {
    const url = `${window.location.origin}/log/${log.id}`;
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
  };

  const handleCardClick = () => {
    if (isDetailPage) return;
    router.push(`/log/${log.id}`);
  };

  return (
    <div className="rounded-lg bg-card flex flex-col">
      {/* Section 1: Profile Header */}
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
                  <AlertDialogAction onClick={handleDelete} disabled={loading}>
                    {loading ? '삭제 중...' : '삭제'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Section 2: Content (Clickable block) */}
      <div onClick={handleCardClick} className={`${!isDetailPage ? 'cursor-pointer' : ''} py-1 pl-[44px] relative`} style={{ marginTop: '-12px' }}>
        <p ref={contentRef} className={`mb-3 text-log-content whitespace-pre-wrap ${!isDetailPage ? 'overflow-hidden max-h-72' : ''}`}>
          {linkifyMentions(log.content, mentionedProfiles, searchQuery)}
        </p>
        {showReadMore && !isDetailPage && (
          <div className="absolute bottom-0 right-0 bg-gradient-to-l from-card to-transparent pl-10 pr-5 pt-2 pb-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/log/${log.id}`);
              }}
              className="text-blue-500 hover:underline text-sm font-semibold"
            >
              ... 더보기
            </button>
          </div>
        )}
        {ogUrl && !log.image_url && (
          <div className="mt-3">
            <OgPreviewCard url={ogUrl} />
          </div>
        )}
        {log.image_url && (
          <div
            className="relative w-full mt-3 rounded-md overflow-hidden max-h-[400px]"
            style={imageStyle ? { ...imageStyle } : {}}
          >
            <Image
              src={log.image_url}
              alt="Log image"
              fill
              style={{ objectFit: imageStyle?.objectFit || "contain" }}
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}
      </div>

      {/* Section 3: Actions (Independent buttons) */}
      <div className="flex justify-between items-center text-sm text-muted-foreground px-[44px] pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLike}
                className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-red-100 dark:hover:bg-red-900/20 group"
              >
                <HeartIcon
                  className={
                    hasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-red-500 group-hover:fill-red-500"
                  }
                  size={18}
                />
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
                onClick={() => {
                  setShowComments(!showComments);
                }}
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

      {/* Section 4: Comments (Shown conditionally) */}
      {showComments && (
        <div className="mt-4 border-t">
          <CommentList logId={log.id} currentUserId={currentUserId} />
          <CommentForm
            logId={log.id}
            currentUserId={currentUserId}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      )}
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
    </div>
  );
}
