"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { HeartIcon, MessageCircle, Trash2, Edit, Share2, Bookmark } from "lucide-react"; // Added MessageCircle and Trash2
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { LogForm } from "@/components/log/log-form";
import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";
import { Database } from "@/types/database.types";

import { useRouter } from "next/navigation";
import { linkifyMentions, formatRelativeTime } from "@/lib/utils"; // Only linkifyMentions is needed

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
  searchQuery?: string; // New prop
}

export function LogCard({
  log,
  currentUserId,
  initialLikesCount,
  initialHasLiked,
  initialCommentsCount,
  mentionedProfiles,
  searchQuery, // Destructure searchQuery
}: LogCardProps) {
  const supabase = createClient();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount); // Added commentsCount state
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false); // State to toggle comments
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [showReadMore, setShowReadMore] = useState(false); // State for "Read More" button
  const [imageStyle, setImageStyle] = useState<{
    width?: string;
    height?: string;
    aspectRatio?: string;
    objectFit: "cover" | "contain";
    margin?: string;
  } | null>(null);
  const contentRef = useRef<HTMLParagraphElement>(null); // Ref for content paragraph

  useEffect(() => {
    if (contentRef.current) {
      // Approximate line height for 12 lines (e.g., 1.5rem * 12 = 18rem = 288px)
      // Adjust max-height based on your actual line height and font size
      const maxHeight = 12 * 24; // Assuming ~24px per line (text-base is usually 16px, plus line-height)
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
          const targetAspectRatio = 3 / 4; // width:height = 3:4

          if (originalAspectRatio < targetAspectRatio) {
            // If original image is taller than 3:4, fix container to 300px width and 400px height, and cover
            setImageStyle({
              width: "300px",
              height: "400px",
              objectFit: "cover",
              margin: "0 auto", // Add this line for center alignment
            });
          } else {
            // If original image is wider or equal to 3:4, maintain original aspect ratio, and contain
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
    setCommentsCount(initialCommentsCount); // Update commentsCount on prop change
  }, [initialLikesCount, initialHasLiked, initialCommentsCount]);

  const avatarUrlWithCacheBuster = log.profiles?.avatar_url
    ? `${log.profiles.avatar_url}?t=${log.profiles.updated_at ? new Date(log.profiles.updated_at).getTime() : ''}`
    : null;

  const formattedLogDate = log.created_at ? formatRelativeTime(log.created_at) : '';

  const handleLike = async () => {
    if (!currentUserId || loading) return;

    setLoading(true);
    if (hasLiked) {
      // Unlike
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
      // Like
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
    setShowComments(true); // Show comments after adding one
  };

  const handleDelete = async () => {
    if (currentUserId !== log.user_id) return;

    const isConfirmed = window.confirm(
      "정말로 이 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    );
    if (!isConfirmed) return;

    setLoading(true);
    try {
      // Delete image from storage if it exists
      if (log.image_url) {
        const url = new URL(log.image_url);
        const path = url.pathname.split("/logimages/")[1];
        if (path) {
          const { error: storageError } = await supabase.storage
            .from("logimages")
            .remove([path]);
          if (storageError) {
            console.error("Error deleting image from storage:", storageError);
            // Continue with log deletion even if image deletion fails
          }
        }
      }

      // Delete the log itself
      const { error: dbError } = await supabase
        .from("logs")
        .delete()
        .eq("id", log.id);

      if (dbError) {
        throw dbError;
      }

      // No need to update state, realtime will handle it
    } catch (error: unknown) {
      console.error("Error deleting log:", error);
      if (error instanceof Error) {
        alert(`로그 삭제 중 오류가 발생했습니다: ${error.message}`);
      } else {
        alert("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    if (!isEditing) {
      router.push(`/log/${log.id}`);
    }
  };

  return (
    <HoverCard openDelay={350}>
      <div className="border rounded-lg p-4 mb-4 bg-card flex flex-col">
        {/* Section 1: Profile Header (Not clickable as a block) */}
        <div className="flex items-center">
          {avatarUrlWithCacheBuster && (
            <HoverCardTrigger asChild>
              <Link href={`/${log.profiles?.username || log.user_id}`}>
                <Image
                  src={avatarUrlWithCacheBuster}
                  alt={`${log.profiles?.username || "User"}'s avatar`}
                  width={36}
                  height={36}
                  className="rounded-full object-cover mr-3"
                />
              </Link>
            </HoverCardTrigger>
          )}
          <div className="flex-grow">
            <div className="flex items-baseline gap-2">
              <HoverCardTrigger asChild>
                <Link href={`/${log.profiles?.username || log.user_id}`}>
                  <p className="font-semibold hover:underline text-log-content">
                    {log.profiles?.full_name ||
                      log.profiles?.username ||
                      "Anonymous"}
                  </p>
                </Link>
              </HoverCardTrigger>
              
              {log.profiles?.tagline && (
                <p className="text-xs text-muted-foreground">{log.profiles.tagline}</p>
              )}
              <p className="text-xs text-muted-foreground">·&nbsp;&nbsp;&nbsp;{formattedLogDate}</p>
            </div>
            
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {currentUserId === log.user_id && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                  className="p-1 text-muted-foreground hover:text-blue-500 disabled:opacity-50"
                  aria-label="Edit log"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-50"
                  aria-label="Delete log"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Content (Clickable block) */}
        {isEditing ? (
          <LogForm
            userId={currentUserId}
            initialLogData={log}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div onClick={handleCardClick} className="cursor-pointer py-1 pl-[52px] relative">
            <p ref={contentRef} className="mb-3 text-log-content whitespace-pre-wrap overflow-hidden max-h-72">
              {linkifyMentions(log.content, mentionedProfiles, searchQuery)}
            </p>
            {showReadMore && (
              <div className="absolute bottom-0 right-0 bg-gradient-to-l from-card to-transparent pl-10 pr-11 pt-5 pb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    router.push(`/log/${log.id}`);
                  }}
                  className="text-blue-500 hover:underline text-sm font-semibold"
                >
                  ... 더보기
                </button>
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
        )}

        {/* Section 3: Actions (Independent buttons) */}
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
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/log/${log.id}`)}
                  className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-blue-100 hover:text-blue-500 dark:hover:bg-blue-900/20"
                >
                  <Share2 size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>공유</p>
              </TooltipContent>
            </Tooltip>
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
      </div>
      <HoverCardContent className="w-80" align="start" alignOffset={-48}>
        <Link href={`/${log.profiles?.username || log.user_id}`}>
          <div className="flex justify-start space-x-4">
            {avatarUrlWithCacheBuster && (
              <Image
                src={avatarUrlWithCacheBuster}
                alt={`${log.profiles?.username || "User"}'s avatar`}
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            )}
            <div className="space-y-1">
              <h4 className="text-base font-semibold">
                {log.profiles?.full_name || ""}
              </h4>
              <p className="text-sm">@{log.profiles?.username || "Anonymous"}</p>
              <p className="text-xs text-muted-foreground">
                {log.profiles?.tagline || ""}
              </p>
            </div>
          </div>
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
}