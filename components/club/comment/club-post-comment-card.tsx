import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ClubPostCommentForm } from "./club-post-comment-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { MessageCircle } from 'lucide-react';
import { useRouter } from "next/navigation";

import { linkifyMentions, formatRelativeTime } from "@/lib/utils";
import { Database } from "@/types/database.types";
import { deleteClubPostComment } from "@/app/socialing/club/club-actions";

type AuthorProfile = Database['public']['Tables']['profiles']['Row'];

export type ProcessedClubPostComment = Database['public']['Tables']['club_forum_post_comments']['Row'] & {
  author: AuthorProfile | null;
  replies?: ProcessedClubPostComment[];
};

interface ClubPostCommentCardProps {
  comment: ProcessedClubPostComment;
  currentUserId: string | null;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  postId: string;
  level: number;
  clubId: string;
  isDetailPage?: boolean;
  setReplyTo?: (replyTo: { parentId: string; authorName: string; authorUsername: string | null; authorAvatarUrl: string | null }) => void;
  newCommentId?: string;
  newParentCommentId?: string;
}

export function ClubPostCommentCard({
  comment,
  currentUserId,
  mentionedProfiles,
  postId,
  level = 0, // Default value for level
  clubId,
  isDetailPage = false,
  setReplyTo,
  newCommentId,
  newParentCommentId,
}: ClubPostCommentCardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [displayReplyCount, setDisplayReplyCount] = useState(5);

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

  const avatarUrlWithCacheBuster = comment.author?.avatar_url || null;
  const formattedCommentDate = comment.created_at ? formatRelativeTime(comment.created_at) : '';

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
    <div className="flex items-start justify-between gap-3 p-1">
      <div className="flex items-start gap-3">
        <ProfileHoverCard userId={comment.user_id} profileData={comment.author}>
            {avatarUrlWithCacheBuster && (
              <Link href={`/${comment.author?.username || comment.user_id}`}>
                <Image
                  src={avatarUrlWithCacheBuster}
                  alt={`${comment.author?.username || "User"}'s avatar`}
                  width={32}
                  height={32}
                  className="rounded-full object-cover aspect-square flex-shrink-0"
                />
              </Link>
            )}
        </ProfileHoverCard>
        <div className="flex-grow min-w-0">
          <ProfileHoverCard userId={comment.user_id} profileData={comment.author}>
            <div className="flex items-baseline gap-1">
                <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
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
              <div className="flex items-center gap-2 mt-2">
                {level < 1 && (
                  <button
                    onClick={() => setShowReplies(!showReplies)}
                    className={`p-1 text-muted-foreground hover:text-green-500 flex items-center gap-1 ${showReplies ? 'text-green-500' : ''}`}
                    aria-label="Reply to comment"
                  >
                    <MessageCircle size={14} />
                    <span className="text-xs">{comment.replies?.length || 0}</span>
                  </button>
                )}
                {level > 0 && setReplyTo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:bg-muted-foreground/10"
                    onClick={() => setReplyTo({
                      parentId: comment.parent_comment_id || comment.id,
                      authorName: comment.author?.full_name || comment.author?.username || "Anonymous",
                      authorUsername: comment.author?.username || null,
                      authorAvatarUrl: comment.author?.avatar_url || null
                    })}
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
                  {comment.replies.slice(0, displayReplyCount).map((reply: ProcessedClubPostComment) => (
                    <ClubPostCommentCard
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      mentionedProfiles={mentionedProfiles}
                      postId={postId}
                      level={level + 1}
                      clubId={clubId}
                      isDetailPage={isDetailPage}
                      setReplyTo={setReplyTo}
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
                <div className="flex justify-start mt-0">
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

              
            </>
          )}
        </div>
      </div>
    </div>
  );
}
