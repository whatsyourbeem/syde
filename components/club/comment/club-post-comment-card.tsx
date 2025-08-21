"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ClubPostCommentForm } from "./club-post-comment-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

import { linkifyMentions } from "@/lib/utils";
import { Database } from "@/types/database.types";
import { deleteClubPostComment } from "@/app/socialing/club/actions";

type AuthorProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'username' | 'full_name' | 'avatar_url'>; // Define a specific type for fetched author profile

type ProcessedClubPostComment = Database['public']['Tables']['club_forum_post_comments']['Row'] & {
  author: AuthorProfile | null;
  replies?: ProcessedClubPostComment[];
};

interface ClubPostCommentCardProps {
  comment: ProcessedClubPostComment;
  currentUserId: string | null;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  postId: string;
  level: number;
}

export function ClubPostCommentCard({
  comment,
  currentUserId,
  mentionedProfiles,
  postId,
  level,
}: ClubPostCommentCardProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(level === 0 ? false : true);

  const avatarUrlWithCacheBuster = comment.author?.avatar_url || null;

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
    <HoverCard openDelay={350}>
      <div className="flex items-start justify-between gap-3 p-2">
        <div className="flex items-start gap-3">
          {avatarUrlWithCacheBuster && (
            <HoverCardTrigger asChild>
              <Link href={`/${comment.author?.username || comment.user_id}`}>
                <Image
                  src={avatarUrlWithCacheBuster}
                  alt={`${comment.author?.username || "User"}'s avatar`}
                  width={32}
                  height={32}
                  className="rounded-full object-cover flex-shrink-0"
                />
              </Link>
            </HoverCardTrigger>
          )}
          <div className="flex-grow">
            <div className="flex items-center gap-2">
              <HoverCardTrigger asChild>
                <Link href={`/${comment.author?.username || comment.user_id}`}>
                  <p className="font-semibold text-sm hover:underline">
                    {comment.author?.full_name ||
                      comment.author?.username ||
                      "Anonymous"}
                  </p>
                </Link>
              </HoverCardTrigger>
              <p className="text-xs text-muted-foreground">
                @{comment.author?.username || comment.user_id}
              </p>
            </div>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      className="text-xs text-muted-foreground hover:text-blue-500"
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
                {showReplyForm && (
                  <div className="mt-2 ml-4">
                    <ClubPostCommentForm
                      postId={postId}
                      currentUserId={currentUserId}
                      parentCommentId={comment.id}
                      onCommentAdded={() => setShowReplyForm(false)}
                      onCancel={() => setShowReplyForm(false)}
                    />
                  </div>
                )}
                {comment.replies && comment.replies.length > 0 && level === 0 && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplies(!showReplies)}
                      className="text-xs text-muted-foreground"
                    >
                      {showReplies ? "답글 숨기기" : `답글 ${comment.replies.length}개 보기`}
                    </Button>
                  </div>
                )}
                {showReplies && comment.replies && comment.replies.length > 0 && (
                  <div className="mt-2 space-y-2 border-l pl-4">
                    {comment.replies.map((reply) => (
                      <ClubPostCommentCard
                        key={reply.id}
                        comment={reply}
                        currentUserId={currentUserId}
                        mentionedProfiles={mentionedProfiles}
                        postId={postId}
                        level={level + 1}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <HoverCardContent className="w-80" align="start" alignOffset={-44}>
        <Link href={`/${comment.author?.username || comment.user_id}`}>
          <div className="flex justify-start space-x-4">
            {avatarUrlWithCacheBuster && (
              <Image
                src={avatarUrlWithCacheBuster}
                alt={`${comment.author?.username || "User"}'s avatar`}
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            )}
            <div className="space-y-1">
              <h4 className="text-base font-semibold">
                {comment.author?.full_name || ""}
              </h4>
              <p className="text-sm">@{comment.author?.username || "Anonymous"}</p>
            </div>
          </div>
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
}
