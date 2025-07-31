"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { linkifyMentions, formatRelativeTime } from '@/lib/utils'; // Import formatRelativeTime
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, HeartIcon, MessageCircle, Share2, Bookmark, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { LogForm } from '@/components/log-form';
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { Database } from "@/types/database.types";


type LogWithRelations = Database['public']['Tables']['logs']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'] | null;
  log_likes: Array<{ user_id: string }>;
  log_comments: Array<{ id: string }>;
};

interface LogDetailProps {
  log: LogWithRelations;
  user: User | null;
}

export function LogDetail({ log: initialLog, user }: LogDetailProps) {
  const supabase = createClient();
  const router = useRouter(); // Add this line
  const [log, setLog] = useState(initialLog);
  const [isEditing, setIsEditing] = useState(false);
  const [mentionedProfiles, setMentionedProfiles] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(initialLog.log_comments.length); // Added commentsCount state

  // New states for likes
  const [currentLikesCount, setCurrentLikesCount] = useState(initialLog.log_likes.length);
  const [currentHasLiked, setCurrentHasLiked] = useState(
    user ? initialLog.log_likes.some((like: { user_id: string }) => like.user_id === user.id) : false
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

  const handleLogUpdate = (updatedLog: any) => {
    setLog((prevLog: any) => ({
      ...prevLog,
      content: updatedLog.content,
      image_url: updatedLog.image_url,
    }));
    setIsEditing(false);
  };

  const avatarUrlWithCacheBuster = log.profiles?.avatar_url
    ? `${log.profiles.avatar_url}?t=${log.profiles.updated_at ? new Date(log.profiles.updated_at).getTime() : ''}`
    : null;

  const formattedLogDate = log.created_at ? formatRelativeTime(log.created_at) : '';

  return (
    <div className="border rounded-lg pt-2 px-4 pb-4 mb-4 bg-card flex flex-col">
      {/* Back Button Bar */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full text-muted-foreground hover:bg-secondary"
          aria-label="Go back" 
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      {/* Section 1: Profile Header (Not clickable as a block) */}
      <div className="flex items-center justify-between">
          {avatarUrlWithCacheBuster && (
            <Link href={`/${log.profiles?.username || log.user_id}`}>
              <Image
                src={avatarUrlWithCacheBuster}
                alt={`${log.profiles?.username || 'User'}'s avatar`}
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
                  {log.profiles?.full_name || log.profiles?.username || 'Anonymous'}
                </p>
              </Link>
            {log.profiles?.tagline && (
              <p className="text-xs text-muted-foreground">{log.profiles.tagline}</p>
            )}
            <p className="text-xs text-muted-foreground">·&nbsp;&nbsp;&nbsp;{formattedLogDate}</p>
            </div>
          </div>
          {user?.id === log.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 text-muted-foreground hover:text-blue-500">
                  <MoreVertical size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  수정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
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
                    alert(`로그 삭제 중 오류가 발생했습니다: ${dbError.message}`);
                  }
                }}>
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
 
      {/* Log Content or Edit Form */}
      {isEditing ? (
        <LogForm
          userId={user?.id || null}
          initialLogData={log}
          onLogUpdated={handleLogUpdate}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="py-1 pl-11">
          <p className="mb-3 text-base whitespace-pre-wrap leading-relaxed">
            {linkifyMentions(log.content, mentionedProfiles)}
          </p>
          {log.image_url && (
            <div className="relative w-full h-72 mt-4 rounded-lg overflow-hidden shadow-md">
              <Image
                src={log.image_url}
                alt="Log image"
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}
        </div>
      )}

      {/* Actions (Likes, Comments, Share, Save) */}
      <div className="flex justify-between items-center text-sm text-muted-foreground px-[52px] pt-2">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/20"
        >
          <HeartIcon
            className={
              currentHasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500 hover:fill-red-500"
            }
            size={18}
          />
          <span>{currentLikesCount}</span>
        </button>
        <button
          onClick={() => {
            // setShowComments(!showComments);
          }}
          className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-green-100 hover:text-green-500 dark:hover:bg-green-900/20"
        >
          <MessageCircle size={18} />
          <span>{commentsCount}</span>
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/log/${log.id}`)}
          className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-blue-100 hover:text-blue-500 dark:hover:bg-blue-900/20"
        >
          <Share2 size={18} />
        </button>
        <button
          onClick={() => console.log("Save button clicked!")}
          className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-yellow-100 hover:text-yellow-500 dark:hover:bg-yellow-900/20"
        >
          <Bookmark size={18} />
        </button>
      </div>

      {/* Comments Section */}
      <div className="mt-8 pt-4">
        <CommentList 
          logId={log.id} 
          currentUserId={user?.id || null} 
          pageSize={10} 
          showPaginationButtons={true} 
        />
        <CommentForm logId={log.id} currentUserId={user?.id || null} onCommentAdded={handleCommentAdded} />
      </div>
    </div>
  );
}
