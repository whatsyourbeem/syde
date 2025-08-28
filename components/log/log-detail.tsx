"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { linkifyMentions, formatRelativeTime } from "@/lib/utils"; // Import formatRelativeTime
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  HeartIcon,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  Copy,
  Link2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogEditDialog } from "@/components/log/log-edit-dialog";

import { toast } from "sonner";
import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";
import { Database } from "@/types/database.types";

type LogWithRelations = Database["public"]["Tables"]["logs"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  log_likes: Array<{ user_id: string }>;
  log_comments: Array<{ id: string }>;
};

interface LogDetailProps {
  log: LogWithRelations;
  user: User | null;
}

export function LogDetail({ log, user }: LogDetailProps) {
  const supabase = createClient();
  const router = useRouter();
  
  const [mentionedProfiles, setMentionedProfiles] = useState<
    Array<{ id: string; username: string | null }>
  >([]);
  const [commentsCount, setCommentsCount] = useState(log.log_comments.length);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageStyle, setImageStyle] = useState<{
    aspectRatio: string;
    objectFit: "cover" | "contain";
  } | null>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyUrl, setCopyUrl] = useState("");

  useEffect(() => {
    if (log.image_url) {
      const img = new window.Image();
      img.src = log.image_url;
      img.onload = () => {
        if (img.naturalHeight > 0) {
          const originalAspectRatio = img.naturalWidth / img.naturalHeight;
          const finalAspectRatio = originalAspectRatio;
          const finalObjectFit: "cover" | "contain" = "contain";

          setImageStyle({
            aspectRatio: `${finalAspectRatio}`,
            objectFit: finalObjectFit,
          });
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
    const fetchMentionedProfiles = async () => {
      const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
      const mentionedUserIds = new Set<string>();
      const matches = log.content.matchAll(mentionRegex);
      for (const match of matches) {
        mentionedUserIds.add(match[1]);
      }

      if (mentionedUserIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", Array.from(mentionedUserIds));

        if (profilesError) {
          console.error("Error fetching mentioned profiles:", profilesError);
        } else {
          setMentionedProfiles(profilesData || []);
        }
      } else {
        setMentionedProfiles([]);
      }
    };

    fetchMentionedProfiles();
  }, [log.content, supabase]); // Re-run when log content changes

  // New states for likes
  const [currentLikesCount, setCurrentLikesCount] = useState(
    log.log_likes.length
  );
  const [currentHasLiked, setCurrentHasLiked] = useState(
    user
      ? log.log_likes.some(
          (like: { user_id: string }) => like.user_id === user.id
        )
      : false
  );

  const handleLike = async () => {
    if (!user?.id) return; // User must be logged in to like

    // setLoading(true); // Consider adding a loading state if needed
    if (currentHasLiked) {
      // Unlike
      const { error } = await supabase
        .from("log_likes")
        .delete()
        .eq("log_id", log.id)
        .eq("user_id", user.id);

      if (!error) {
        setCurrentLikesCount((prev) => prev - 1);
        setCurrentHasLiked(false);
      } else {
        console.error("Error unliking log:", error);
      }
    } else {
      // Like
      const { error } = await supabase
        .from("log_likes")
        .insert({ log_id: log.id, user_id: user.id });

      if (!error) {
        setCurrentLikesCount((prev) => prev + 1);
        setCurrentHasLiked(true);
      } else {
        console.error("Error liking log:", error);
      }
    }
    // setLoading(false);
  };

  const handleCommentAdded = () => {
    setCommentsCount((prev) => prev + 1);
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

  const avatarUrlWithCacheBuster = log.profiles?.avatar_url
    ? `${log.profiles.avatar_url}?t=${
        log.profiles.updated_at
          ? new Date(log.profiles.updated_at).getTime()
          : ""
      }`
    : null;

  const formattedLogDate = log.created_at
    ? formatRelativeTime(log.created_at)
    : "";

  return (
    <div className="px-4 pb-4 mb-4 bg-card flex flex-col">
      {/* Back Button Bar */}
      <div className="flex items-center mb-2 mt-2">
        <button
          onClick={() => router.push('/log')}
          className="p-2 rounded-full text-muted-foreground hover:bg-secondary"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      
      <div className="border-b border-border mb-4"></div> {/* Separator */}
      {/* Section 1: Profile Header (Not clickable as a block) */}
      <div className="flex items-center justify-between">
        <ProfileHoverCard userId={log.user_id} profileData={log.profiles}>
          <div className="flex items-center">
            <Link href={`/${log.profiles?.username || log.user_id}`}>
              {avatarUrlWithCacheBuster && (
                <Image
                  src={avatarUrlWithCacheBuster}
                  alt={`${log.profiles?.username || "User"}'s avatar`}
                  width={40}
                  height={40}
                  className="rounded-full object-cover mr-3"
                />
              )}
            </Link>
            <div className="flex-grow">
              <div className="flex items-baseline gap-2">
                <Link href={`/${log.profiles?.username || log.user_id}`}>
                  <p className="font-semibold hover:underline">
                    {log.profiles?.full_name ||
                      log.profiles?.username ||
                      "Anonymous"}
                  </p>
                </Link>
                {log.profiles?.tagline && (
                  <p className="text-xs text-muted-foreground">
                    {log.profiles.tagline}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  ·&nbsp;&nbsp;&nbsp;{formattedLogDate}
                </p>
              </div>
            </div>
          </div>
        </ProfileHoverCard>
        {user?.id === log.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-muted-foreground hover:text-blue-500">
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <LogEditDialog
                userId={user?.id || null}
                avatarUrl={log.profiles?.avatar_url || null}
                username={log.profiles?.username || null}
                full_name={log.profiles?.full_name || null}
                initialLogData={log}
                onSuccess={() => router.refresh()}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  수정
                </DropdownMenuItem>
              </LogEditDialog>
              <DropdownMenuItem
                onClick={async () => {
                  const isConfirmed = window.confirm(
                    "정말로 이 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                  );
                  if (!isConfirmed) return;
                  // Implement delete logic here, similar to LogCard
                  // For now, just console log
                  console.log("Delete log with ID:", log.id);
                  // You'll need to add actual delete logic here, including storage and DB
                  // and then redirect or update UI
                  const { error: dbError } = await supabase
                    .from("logs")
                    .delete()
                    .eq("id", log.id);
                  if (!dbError) {
                    // Redirect to home or previous page after deletion
                    window.location.href = "/"; // Simple redirect for now
                  } else {
                    console.error("Error deleting log:", dbError);
                    alert(
                      `로그 삭제 중 오류가 발생했습니다: ${dbError.message}`
                    );
                  }
                }}
              >
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {/* Log Content or Edit Form */}
      <div className="py-1 pl-11">
          <p className="mb-3 text-base whitespace-pre-wrap leading-relaxed">
            {linkifyMentions(log.content, mentionedProfiles)}
          </p>
          {log.image_url && imageStyle && (
            <div
              className="relative w-full mt-4 rounded-lg overflow-hidden cursor-pointer max-h-[60vh]"
              style={{ aspectRatio: imageStyle.aspectRatio }}
              onClick={() => setShowImageModal(true)} // Add onClick to show modal
            >
              <Image
                src={log.image_url!}
                alt="Log image"
                fill
                style={{ objectFit: imageStyle.objectFit }}
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}
        </div>
      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setShowImageModal(false)} // Close modal on overlay click
        >
          <div
            className="relative max-w-full max-h-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {" "}
            {/* Prevent closing when clicking image itself */}
            <Image
              src={log.image_url!}
              alt="Full size log image"
              width={0} // Set width to 0 to allow fill to work
              height={0} // Set height to 0 to allow fill to work
              sizes="100vw"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      )}
      {/* Actions (Likes, Comments, Share, Save) */}
      <div className="flex justify-between items-center text-sm text-muted-foreground px-[52px] pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLike}
                className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-red-100 dark:hover:bg-red-900/20 group"
              >
                <HeartIcon
                  className={
                    currentHasLiked
                      ? "fill-red-500 text-red-500"
                      : "text-muted-foreground group-hover:text-red-500 group-hover:fill-red-500"
                  }
                  size={18}
                />
                <span className="group-hover:text-red-500">
                  {currentLikesCount}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-100">
              <p>좋아요</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  // setShowComments(!showComments);
                }}
                className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-green-100 hover:text-green-500 dark:hover:bg-green-900/20"
              >
                <MessageCircle size={18} />
                <span>{commentsCount}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-gray-100">
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
              <TooltipContent side="bottom" className="bg-gray-100">
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
            <TooltipContent side="bottom" className="bg-gray-100">
              <p>저장</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* Comments Section */}
      <div className="mt-4 border-t">
        <CommentList
          logId={log.id}
          currentUserId={user?.id || null}
          pageSize={10}
          showPaginationButtons={true}
          isDetailPage={true}
        />
        <CommentForm
          logId={log.id}
          currentUserId={user?.id || null}
          onCommentAdded={handleCommentAdded}
        />
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
    </div>
  );
}
