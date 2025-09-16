"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ClubPostCommentCard, ProcessedClubPostComment } from "./club-post-comment-card";
import { Button } from "@/components/ui/button";

import { fetchClubPostComments } from "@/app/socialing/club/club-actions";

interface ClubPostCommentListProps {
  postId: string;
  currentUserId: string | null;
  clubId: string;
  pageSize?: number;
  showPaginationButtons?: boolean;
  isDetailPage?: boolean;
  setReplyTo?: (replyTo: { parentId: string; authorName: string; authorUsername: string | null; authorAvatarUrl: string | null; } | null) => void;
}

export function ClubPostCommentList({
  postId,
  currentUserId,
  clubId,
  pageSize = 5,
  showPaginationButtons = false,
  isDetailPage = false,
  setReplyTo,
}: ClubPostCommentListProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [commentLikes, setCommentLikes] = useState<Record<string, { likesCount: number; hasLiked: boolean }>>({});

  const handleLikeStatusChange = (commentId: string, newLikesCount: number, newHasLiked: boolean) => {
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: { likesCount: newLikesCount, hasLiked: newHasLiked },
    }));
  };

  const queryKey = useMemo(() => ["clubPostComments", { postId, currentPage, pageSize }], [postId, currentPage, pageSize]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const { comments, count, error: fetchError } = await fetchClubPostComments(postId, currentPage, pageSize);

      if (fetchError) {
        throw new Error(fetchError);
      }

      const mentionRegex = /\\\[mention:([a-f0-9\\-]+)\\\]/g;
      const mentionedUserIds = new Set<string>();
      comments?.forEach(comment => {
        const matches = comment.content.matchAll(mentionRegex);
        for (const match of matches) {
          mentionedUserIds.add(match[1]);
        }
      });

      let mentionedProfiles: Array<{ id: string; username: string | null }> = [];
      if (mentionedUserIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', Array.from(mentionedUserIds));
        
        if (profilesError) {
          console.error("Error fetching mentioned profiles:", profilesError);
        } else {
          mentionedProfiles = profilesData;
        }
      }

      return {
        comments: (comments as ProcessedClubPostComment[]) || [],
        count: count || 0,
        mentionedProfiles,
      };
    },
  });

  const comments = useMemo(() => data?.comments || [], [data?.comments]);
  const totalCommentsCount = data?.count || 0;
  const mentionedProfiles = data?.mentionedProfiles || [];

  // Helper component for recursive rendering of comments
  const renderComment = (comment: ProcessedClubPostComment, level: number = 0) => (
    <div key={comment.id} className={level > 0 ? "ml-8 mt-2" : ""}> {/* Indent replies */}
      <ClubPostCommentCard
        comment={comment}
        currentUserId={currentUserId}
        mentionedProfiles={mentionedProfiles}
        postId={postId}
        level={level}
        clubId={clubId}
        isDetailPage={isDetailPage}
        setReplyTo={setReplyTo}
        userId={comment.user_id}
        isLiked={commentLikes[comment.id]?.hasLiked ?? comment.initialHasLiked}
        likeCount={commentLikes[comment.id]?.likesCount ?? comment.initialLikesCount}
        initialLikesCount={commentLikes[comment.id]?.likesCount ?? comment.initialLikesCount}
        initialHasLiked={commentLikes[comment.id]?.hasLiked ?? comment.initialHasLiked}
        onLikeStatusChange={handleLikeStatusChange}
        />
    </div>
  );


  // Handle real-time updates for comments
  useEffect(() => {
    const channel = supabase
      .channel(`club-post-comments-for-post-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "club_forum_post_comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["clubPostComments", { postId }] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "club_forum_post_comments",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["clubPostComments", { postId }] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "club_forum_post_comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["clubPostComments", { postId }] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, postId, queryClient]);

  

  if (isLoading) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        댓글을 불러오는 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-sm text-red-500">
        Error: {error?.message}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {comments.length === 0 && !isLoading ? (
        <p className="text-center text-sm text-muted-foreground">
          아직 댓글이 없습니다.
        </p>
      ) : (
        comments.map((comment) => renderComment(comment))
      )}
      
      {showPaginationButtons && totalCommentsCount > pageSize && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from(
            { length: Math.ceil(totalCommentsCount / pageSize) },
            (_, i) => (
              <Button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                variant="ghost"
                className={currentPage === i + 1 ? "bg-secondary" : ""}
                disabled={isLoading}
              >
                {i + 1}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
