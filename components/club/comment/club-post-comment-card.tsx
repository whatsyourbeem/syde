"use client";

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HeartIcon, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { ClubPostCommentForm } from "./club-post-comment-form";
import { useQueryClient } from "@tanstack/react-query";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { useLoginDialog } from '@/context/LoginDialogContext';

import { useRouter } from "next/navigation";

import { linkifyMentions, formatRelativeTime } from "@/lib/utils";

import { Database } from "@/types/database.types";
import { deleteClubPostComment } from "@/app/socialing/club/club-actions";

type AuthorProfile = Database['public']['Tables']['profiles']['Row'];

export type ProcessedClubPostComment = Database['public']['Tables']['club_forum_post_comments']['Row'] & {
  author: AuthorProfile | null;
  initialLikesCount: number;
  initialHasLiked: boolean;
  replies?: ProcessedClubPostComment[];
};

import { Button } from "@/components/ui/button";

interface ClubPostCommentCardProps {
  comment: ProcessedClubPostComment;
  postId: string;
  userId: string | null;
  isLiked: boolean;
  likeCount: number;
  onReplyClick?: (username: string, fullName: string) => void;
  level?: number;
  currentUserId: string | null;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  initialLikesCount: number;
  initialHasLiked: boolean;
  onLikeStatusChange: (commentId: string, newLikesCount: number, newHasLiked: boolean) => void;
  isDetailPage?: boolean;
  isMobile?: boolean;
  clubId: string;
  setReplyTo?: (replyTo: { parentId: string; authorName: string; authorUsername: string | null; authorAvatarUrl: string | null }) => void;
  newCommentId?: string;
  newParentCommentId?: string;
}

export function ClubPostCommentCard({
  comment,
  currentUserId,
  mentionedProfiles,
  initialLikesCount,
  initialHasLiked,
  onLikeStatusChange,
  postId,
  level = 0,
  isDetailPage = false,
  isMobile = false,
  clubId,
  setReplyTo,
  newCommentId,
  newParentCommentId,
}: ClubPostCommentCardProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [showReplies, setShowReplies] = useState(false);
  const [displayReplyCount, setDisplayReplyCount] = useState(5);
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

  const avatarUrlWithCacheBuster = comment.author?.avatar_url
    ? `${comment.author.avatar_url}?t=${comment.author.updated_at ? new Date(comment.author.updated_at).getTime() : ''}`
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
    onLikeStatusChange(comment.id, newLikesCount, newHasLiked);
  };

  const handleDelete = async () => {
    if (currentUserId !== comment.user_id) return;

    const isConfirmed = window.confirm("정말로 이 댓글을 삭제하시겠습니까?");
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const result = await deleteClubPostComment(comment.id);
      if (result.error) {
        throw new Error(result.error);
      }
      queryClient.invalidateQueries({
        queryKey: ["clubPostComments", { postId: comment.post_id }],
      });
    } catch (error: unknown) {
      console.error("Error deleting club post comment:", error);
      alert(`댓글 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <ProfileHoverCard userId={comment.user_id} profileData={comment.author}>
            <Link href={`/${comment.author?.username || comment.user_id}`}>
              {avatarUrlWithCacheBuster && (
                <Image
                  src={avatarUrlWithCacheBuster}
                  alt={`${comment.author?.username || "User"}'s avatar`}
                  width={32}
                  height={32}
                  className="rounded-full object-cover aspect-square"
                />
              )}
            </Link>
          </ProfileHoverCard>
        </div>
        <div className="flex-grow min-w-0">
          <ProfileHoverCard userId={comment.user_id} profileData={comment.author}>
            <div className="flex items-baseline gap-1">
              <div className="flex flex-col md:flex-row md:gap-2">
                <Link href={`/${comment.author?.username || comment.user_id}`} className="min-w-0">
                  <p className="font-semibold text-sm hover:underline truncate max-w-48">
                    {comment.author?.full_name ||
                      comment.author?.username ||
                      "Anonymous"}
                  </p>
                </Link>
              {comment.author?.tagline && (
                <p className="text-xs text-muted-foreground truncate min-w-0 max-w-48">{comment.author.tagline}</p>
              )}
              </div>
              <p className="text-xs text-muted-foreground">·&nbsp;&nbsp;{formattedCommentDate}</p>
            </div>
          </ProfileHoverCard>
          {isEditing ? (
            <ClubPostCommentForm
              postId={comment.post_id}
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
                          authorName: comment.author?.full_name || comment.author?.username || "Anonymous",
                          authorUsername: comment.author?.username || null,
                          authorAvatarUrl: comment.author?.avatar_url || null
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
                        authorName: comment.author?.full_name || comment.author?.username || "Anonymous",
                        authorUsername: comment.author?.username || null,
                        authorAvatarUrl: comment.author?.avatar_url || null
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
              
            </>
          )}
        </div>
      </div>
      <div className="w-full pl-4">
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2 border-l pl-4">
            {comment.replies.slice(0, displayReplyCount).map((reply: ProcessedClubPostComment) => (
              <ClubPostCommentCard
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                mentionedProfiles={mentionedProfiles}
                initialLikesCount={reply.initialLikesCount}
                initialHasLiked={reply.initialHasLiked}
                onLikeStatusChange={onLikeStatusChange}
                postId={postId}
                level={level + 1}
                isMobile={isMobile}
                clubId={clubId}
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
                // Pass props required by ClubPostCommentCard for each reply
                userId={reply.user_id}
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
                      router.push(`/socialing/club/${clubId}/post/${postId}`);
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
            <ClubPostCommentForm
              postId={postId}
              currentUserId={currentUserId}
              parentCommentId={comment.id}
              onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ["clubPostComments", { postId }] })}
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
                    authorName: comment.author?.full_name || comment.author?.username || "Anonymous",
                    authorUsername: comment.author?.username || null,
                    authorAvatarUrl: comment.author?.avatar_url || null
                  });
                  // For mobile, we still want to use the parent's setReplyTo to open the main comment form
                  // and pre-fill it. The setShowReplies(true) is not needed here as the mobile button
                  // itself is within the showReplies block.
                }}
                className="w-full justify-start px-3 py-2 h-auto text-xs text-muted-foreground"
                variant="ghost"
            >
              <div className="flex items-center gap-2">
                {comment.author?.avatar_url && (
                  <Image
                    src={comment.author.avatar_url}
                    alt={comment.author.username || "User"}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                )}
                {`${comment.author?.full_name || comment.author?.username || "Anonymous"}에게 답글 달기...`}
              </div>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}