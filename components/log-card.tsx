"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { HeartIcon, MessageCircle, Trash2, Edit } from "lucide-react"; // Added MessageCircle and Trash2
import { LogForm } from "./log-form"; // Import LogForm
import { CommentForm } from "./comment-form"; // Will create this
import { CommentList } from "./comment-list"; // Will create this

import { useRouter } from "next/navigation";
import { linkifyMentions } from "@/lib/utils";

interface LogCardProps {
  log: {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    user_id: string;
    profiles: {
      username: string | null;
      full_name: string | null;
      avatar_url: string | null;
      updated_at: string;
      tagline: string | null;
    } | null;
    log_likes: { user_id: string }[];
    log_comments: { id: string }[];
  };
  currentUserId: string | null;
  initialLikesCount: number;
  initialHasLiked: boolean;
  initialCommentsCount: number;
  mentionedProfiles: any[];
}

export function LogCard({
  log,
  currentUserId,
  initialLikesCount,
  initialHasLiked,
  initialCommentsCount,
  mentionedProfiles,
}: LogCardProps) {
  const supabase = createClient();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount); // Added commentsCount state
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false); // State to toggle comments
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode

  useEffect(() => {
    setLikesCount(initialLikesCount);
    setHasLiked(initialHasLiked);
    setCommentsCount(initialCommentsCount); // Update commentsCount on prop change
  }, [initialLikesCount, initialHasLiked, initialCommentsCount]);

  const avatarUrlWithCacheBuster = log.profiles?.avatar_url
    ? `${log.profiles.avatar_url}?t=${new Date(
        log.profiles.updated_at
      ).getTime()}`
    : null;

  const logDate = new Date(log.created_at).toLocaleString();

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
    } catch (error: any) {
      console.error("Error deleting log:", error);
      alert(`로그 삭제 중 오류가 발생했습니다: ${error.message}`);
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
    <div className="border rounded-lg p-4 mb-4 bg-card shadow-sm flex flex-col">
      {/* Section 1: Profile Header (Not clickable as a block) */}
      <div className="flex items-center">
        {avatarUrlWithCacheBuster && (
          <Link href={`/${log.profiles?.username || log.user_id}`}>
            <Image
              src={avatarUrlWithCacheBuster}
              alt={`${log.profiles?.username || "User"}'s avatar`}
              width={40}
              height={40}
              className="rounded-full object-cover mr-3"
            />
          </Link>
        )}
        <div className="flex-grow">
          <div className="flex items-baseline gap-2">
            <Link href={`/${log.profiles?.username || log.user_id}`}>
              <p className="font-semibold hover:underline">
                {log.profiles?.full_name ||
                  log.profiles?.username ||
                  "Anonymous"}
              </p>
            </Link>
            {log.profiles?.username && (
              <p className="text-sm text-muted-foreground">
                @{log.profiles?.username}
              </p>
            )}
          </div>
          {log.profiles?.tagline && (
            <p className="text-xs text-muted-foreground">
              {log.profiles.tagline}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{logDate}</p>
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
          onLogUpdated={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div onClick={handleCardClick} className="cursor-pointer py-4">
          <p className="mb-3 text-base whitespace-pre-wrap">
            {linkifyMentions(log.content, mentionedProfiles)}
          </p>
          {log.image_url && (
            <div className="relative w-full h-64 mt-3 rounded-md overflow-hidden">
              <Image
                src={log.image_url}
                alt="Log image"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}
        </div>
      )}

      {/* Section 3: Actions (Independent buttons) */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 rounded-md p-2 -m-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <HeartIcon
            className={
              hasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"
            }
            size={18}
          />
          <span>{likesCount} Likes</span>
        </button>
        <button
          onClick={() => {
            setShowComments(!showComments);
          }}
          className="flex items-center gap-1 rounded-md p-2 -m-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <MessageCircle size={18} />
          <span>{commentsCount} Comments</span>
        </button>
      </div>

      {/* Section 4: Comments (Shown conditionally) */}
      {showComments && (
        <div className="mt-4 border-t pt-4">
          <CommentForm
            logId={log.id}
            currentUserId={currentUserId}
            onCommentAdded={handleCommentAdded}
          />
          <CommentList logId={log.id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}
