"use client";

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HeartIcon, MessageCircle } from "lucide-react"; // Added Edit, HeartIcon
import { useState, useEffect } from "react";
import { CommentForm } from "@/components/comment/comment-form";
import { useQueryClient } from "@tanstack/react-query";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { useLoginDialog } from '@/context/LoginDialogContext';

import { useRouter } from "next/navigation";

import { linkifyMentions, formatRelativeTime } from "@/lib/utils";

import { Database } from "@/types/database.types";

type ProcessedComment = Database['public']['Tables']['log_comments']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'] | null;
  initialLikesCount: number;
  initialHasLiked: boolean;
  replies?: ProcessedComment[]; // Add replies property
};

import { Button } from "../ui/button";

interface CommentCardProps {
  comment: ProcessedComment;
  logId: string;
  userId: string | null;
  isLiked: boolean;
  likeCount: number;
  onReplyClick?: (username: string, fullName: string) => void;
  level?: number;
  currentUserId: string | null;
  mentionedProfiles: any[];
  initialLikesCount: number;
  initialHasLiked: boolean;
  onLikeStatusChange: (commentId: string, newLikesCount: number, newHasLiked: boolean) => void;
  isDetailPage?: boolean;
  isMobile?: boolean;
  setReplyTo?: (replyTo: { parentId: string; authorName: string; authorUsername: string | null; authorAvatarUrl: string | null }) => void;
  newCommentId?: string;
  newParentCommentId?: string;
}

export function CommentCard({
  comment,
  currentUserId,
  mentionedProfiles,
  initialLikesCount,
  initialHasLiked,
  onLikeStatusChange,
  logId, // Destructure logId
  level = 0, // Destructure level with default value
  isDetailPage = false, // Destructure isDetailPage with default value
  isMobile = false,
  setReplyTo,
  newCommentId,
  newParentCommentId,
}: CommentCardProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount); // New state
  const [hasLiked, setHasLiked] = useState(initialHasLiked); // New state
  const [showReplies, setShowReplies] = useState(false); // New state for showing replies
  const [displayReplyCount, setDisplayReplyCount] = useState(5); // New state for replies to display
  const [internalReplyTo, setInternalReplyTo] = useState<{ parentId: string; authorName: string | null; authorUsername: string | null; authorAvatarUrl: string | null } | undefined>(undefined);

  useEffect(() => {
    setLikesCount(initialLikesCount);
    setHasLiked(initialHasLiked);
  }, [initialLikesCount, initialHasLiked]);

  useEffect(() => {
    if (newCommentId && newParentCommentId === comment.id) {
      setShowReplies(true);
      // Ensure the new reply is visible by increasing displayReplyCount if needed
      setDisplayReplyCount(prevCount => {
        if (comment.replies && comment.replies.length > prevCount) {
          return comment.replies.length; // Show all replies if new one is added
        }
        return prevCount;
      });
    }
  }, [newCommentId, newParentCommentId, comment.id, comment.replies]);

  const avatarUrlWithCacheBuster = comment.profiles?.avatar_url
    ? `${comment.profiles.avatar_url}?t=${comment.profiles.updated_at ? new Date(comment.profiles.updated_at).getTime() : ''}`
    : null;

  const formattedCommentDate = comment.created_at ? formatRelativeTime(comment.created_at) : '';

  

  const { openLoginDialog } = useLoginDialog();

  const handleLike = async () => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }
    if (loading) return;

    setLoading(true);
    let newLikesCount = likesCount;
    let newHasLiked = hasLiked;

    if (hasLiked) {
      // Unlike
      const { error } = await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", comment.id)
        .eq("user_id", currentUserId);

      if (!error) {
        newLikesCount = likesCount - 1;
        newHasLiked = false;
      } else {
        console.error("Error unliking comment:", error);
      }
    } else {
      // Like
      const { error } = await supabase
        .from("comment_likes")
        .insert({ comment_id: comment.id, user_id: currentUserId });

      if (!error) {
        newLikesCount = likesCount + 1;
        newHasLiked = true;
      } else {
        console.error("Error liking comment:", error);
      }
    }
    setLoading(false);
    setLikesCount(newLikesCount);
    setHasLiked(newHasLiked);
    onLikeStatusChange(comment.id, newLikesCount, newHasLiked); // Notify parent
  };

  const handleDelete = async () => {
    if (currentUserId !== comment.user_id) return;

    const isConfirmed = window.confirm("정말로 이 댓글을 삭제하시겠습니까?");
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("log_comments")
        .delete()
        .eq("id", comment.id);

      if (error) {
        throw error;
      }
      queryClient.invalidateQueries({
        queryKey: ["comments", { logId: comment.log_id }],
      });
    } catch (error: unknown) {
      console.error("Error deleting comment:", error);
      alert(`댓글 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 p-2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <ProfileHoverCard userId={comment.user_id} profileData={comment.profiles}>
            <Link href={`/${comment.profiles?.username || comment.user_id}`}>
              {avatarUrlWithCacheBuster && (
                <Image
                  src={avatarUrlWithCacheBuster}
                  alt={`${comment.profiles?.username || "User"}'s avatar`}
                  width={32}
                  height={32}
                  className="rounded-full object-cover aspect-square"
                />
              )}
            </Link>
          </ProfileHoverCard>
        </div>
        <div className="flex-grow min-w-0">
          <ProfileHoverCard userId={comment.user_id} profileData={comment.profiles}>
            <div className="flex items-baseline gap-1">
                <div className="flex flex-col md:flex-row md:gap-2">
                  <Link href={`/${comment.profiles?.username || comment.user_id}`} className="min-w-0">
                    <p className="font-semibold text-sm hover:underline truncate max-w-48">
                      {comment.profiles?.full_name ||
                        comment.profiles?.username ||
                        "Anonymous"}
                    </p>
                  </Link>
                {comment.profiles?.tagline && (
                  <p className="text-xs text-muted-foreground truncate min-w-0 max-w-48">{comment.profiles.tagline}</p>
                )}
                </div>
              <p className="text-xs text-muted-foreground">·&nbsp;&nbsp;{formattedCommentDate}</p>
            </div>
          </ProfileHoverCard>
          {isEditing ? (
            <CommentForm
              logId={comment.log_id}
              currentUserId={currentUserId}
              initialCommentData={comment}
              onCommentUpdated={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <p className="text-sm mt-1 whitespace-pre-wrap">{linkifyMentions(comment.content, mentionedProfiles)}</p>
              <div className="flex items-center gap-1 mt-2">
                <button
                  onClick={handleLike}
                  disabled={loading || isEditing}
                  className="p-1 mr-2 text-muted-foreground hover:text-red-500 disabled:opacity-50 flex items-center gap-1 group"
                  aria-label="Like comment"
                >
                  <HeartIcon
                    className={hasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-red-500 group-hover:fill-red-500"}
                    size={14}
                  />
                  <span className="text-xs">{likesCount}</span>
                </button>
                {level > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:bg-muted-foreground/10"
                    onClick={() => {
                      // 답글의 답글달기 버튼 클릭시 부모 댓글에게 알리기
                      if (setReplyTo) {
                        setReplyTo({
                          parentId: comment.parent_comment_id || comment.id,
                          authorName: comment.profiles?.full_name || comment.profiles?.username || "Anonymous",
                          authorUsername: comment.profiles?.username || null,
                          authorAvatarUrl: comment.profiles?.avatar_url || null
                        });
                      }
                    }}
                  >
                    답글 달기
                  </Button>
                )}
                {level < 1 && (
                  <button
                    onClick={() => {
                      setShowReplies(!showReplies);
                      if (!showReplies) { // If replies are about to be shown
                        setInternalReplyTo(undefined); // Clear any previous replyTo for the internal form
                      }
                    }}
                    className={`p-1 text-muted-foreground hover:text-green-500 flex items-center gap-1 ${showReplies ? 'text-green-500' : ''}`}
                    aria-label="Reply to comment"
                  >
                    <MessageCircle size={14} />
                    <span className="text-xs">{comment.replies?.length || 0}</span>
                  </button>
                )}
                {level < 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:bg-muted-foreground/10"
                    onClick={() => {
                      setInternalReplyTo({
                        parentId: comment.id,
                        authorName: comment.profiles?.full_name || comment.profiles?.username || "Anonymous",
                        authorUsername: comment.profiles?.username || null,
                        authorAvatarUrl: comment.profiles?.avatar_url || null
                      });
                      setShowReplies(true);
                    }}
                  >
                    답글 달기
                  </Button>
                )}
                {currentUserId === comment.user_id && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      disabled={loading}
                      className="text-xs text-muted-foreground hover:text-blue-500"
                    >
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={loading}
                      className="text-xs text-muted-foreground hover:text-red-500"
                    >
                      삭제
                    </Button>
                  </>
                )}
              </div>
              {showReplies && comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 space-y-2 border-l pl-4">
                  {comment.replies.slice(0, displayReplyCount).map((reply: ProcessedComment) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      mentionedProfiles={mentionedProfiles}
                      initialLikesCount={reply.initialLikesCount}
                      initialHasLiked={reply.initialHasLiked}
                      onLikeStatusChange={onLikeStatusChange}
                      logId={logId}
                      level={level + 1}
                      isMobile={isMobile}
                      setReplyTo={(replyData) => {
                        // 답글의 답글달기 버튼이 클릭되면 이 댓글의 답글 입력란에 멘션을 설정
                        setInternalReplyTo({
                          parentId: comment.id,
                          authorName: replyData.authorName,
                          authorUsername: replyData.authorUsername,
                          authorAvatarUrl: replyData.authorAvatarUrl
                        });
                        setShowReplies(true);
                      }}
                      // Pass props required by CommentCard for each reply
                      userId={reply.user_id} // Assuming user_id is the userId for the reply
                      isLiked={reply.initialHasLiked}
                      likeCount={reply.initialLikesCount}
                      
                    />
                  ))}
                  {comment.replies.length > displayReplyCount && (
                    <div className="flex justify-start mt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (isDetailPage) {
                            setDisplayReplyCount(prevCount => prevCount + 5);
                          } else {
                            router.push(`/log/${logId}`);
                          }
                        }}
                        className="text-xs text-muted-foreground"
                      >
                        {isDetailPage
                          ? `답글 ${Math.max(0, comment.replies.length - displayReplyCount)}개 더보기...`
                          : `답글 ${comment.replies.length-5}개 더보기...`}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {showReplies && comment.replies && comment.replies.length > 0 && comment.replies.length <= displayReplyCount && (
                <div className="flex justify-start mt-0 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplies(false)}
                    className="text-xs text-muted-foreground"
                  >
                    답글 숨기기
                  </Button>
                </div>
              )}
              {showReplies && !isMobile && level === 0 && (
                <div className="mt-2 ml-4">
                  <CommentForm
                    logId={logId}
                    currentUserId={currentUserId}
                    parentCommentId={comment.id}
                    onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ["comments", { logId }] })}
                    onCancel={() => setShowReplies(false)}
                    replyTo={internalReplyTo}
                  />
                </div>
              )}
              
              
              {showReplies && isMobile && setReplyTo && (
                <div className="ml-4">
                  <Button
                      onClick={() => {
                        setReplyTo({
                          parentId: comment.id,
                          authorName: comment.profiles?.full_name || comment.profiles?.username || "Anonymous",
                          authorUsername: comment.profiles?.username || null,
                          authorAvatarUrl: comment.profiles?.avatar_url || null
                        });
                        // For mobile, we still want to use the parent's setReplyTo to open the main comment form
                        // and pre-fill it. The setShowReplies(true) is not needed here as the mobile button
                        // itself is within the showReplies block.
                      }}
                      className="w-full justify-start px-3 py-2 h-auto text-xs text-muted-foreground"
                      variant="ghost"
                  >
                    <div className="flex items-center gap-2">
                      {comment.profiles?.avatar_url && (
                        <Image 
                          src={comment.profiles.avatar_url}
                          alt={comment.profiles.username || "User"}
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                      )}
                      {`${comment.profiles?.full_name || comment.profiles?.username || "Anonymous"}에게 답글 달기...`}
                    </div>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}