"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CommentCard } from "./comment-card";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Database } from "@/types/database.types";

interface CommentListProps {
  logId: string;
  currentUserId: string | null;
  pageSize?: number;
  showPaginationButtons?: boolean;
}

export function CommentList({
  logId,
  currentUserId,
  pageSize = 5,
  showPaginationButtons = false
}: CommentListProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const queryKey = ["comments", { logId, currentPage, pageSize }];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("log_comments")
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          log_id,
          parent_comment_id,
          profiles!log_comments_user_id_fkey (username, full_name, avatar_url, updated_at),
          comment_likes(user_id)
        `,
          { count: "exact" }
        )
        .eq("log_id", logId)
        .order("created_at", { ascending: true }); // Remove range for now to fetch all comments for structuring

      if (error) {
        throw error;
      }

      // Function to build a tree structure from a flat list of comments
      const buildCommentTree = (comments: any[]) => {
        const commentMap: { [key: string]: any } = {};
        const rootComments: any[] = [];

        comments.forEach(comment => {
          commentMap[comment.id] = { ...comment, replies: [] };
        });

        comments.forEach(comment => {
          if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
            commentMap[comment.parent_comment_id].replies.push(commentMap[comment.id]);
          } else {
            rootComments.push(commentMap[comment.id]);
          }
        });

        // Sort replies by created_at
        Object.values(commentMap).forEach((comment: any) => {
          comment.replies.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });

        // Sort root comments by created_at
        rootComments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return rootComments;
      };

      const allComments = data || [];
      const commentTree = buildCommentTree(allComments);

      // Apply pagination after building the tree
      const paginatedComments = commentTree.slice(from, to + 1);

      const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
      let mentionedUserIds = new Set<string>();
      allComments?.forEach(comment => {
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

      type CommentRow = Database['public']['Tables']['log_comments']['Row'];
      type ProfileRow = Database['public']['Tables']['profiles']['Row'];
      type CommentLikeRow = Database['public']['Tables']['comment_likes']['Row'];

      type ProcessedComment = CommentRow & {
        profiles: ProfileRow | null;
        comment_likes: Array<{ user_id: string }>;
        initialLikesCount: number;
        initialHasLiked: boolean;
        replies?: ProcessedComment[]; // Add replies property
      };

      const commentsWithProcessedData: ProcessedComment[] = paginatedComments.map((comment: any) => {
        const initialLikesCount = comment.comment_likes?.length || 0;
        const initialHasLiked = currentUserId
          ? comment.comment_likes?.some(
              (like: { user_id: string }) => like.user_id === currentUserId
            )
          : false;

        return {
          ...comment,
          profiles: Array.isArray(comment.profiles)
            ? comment.profiles[0]
            : comment.profiles,
          initialLikesCount,
          initialHasLiked,
          replies: comment.replies ? comment.replies.map((reply: any) => ({ // Recursively process replies
            ...reply,
            profiles: Array.isArray(reply.profiles)
              ? reply.profiles[0]
              : reply.profiles,
            initialLikesCount: reply.comment_likes?.length || 0,
            initialHasLiked: currentUserId
              ? reply.comment_likes?.some(
                  (like: { user_id: string }) => like.user_id === currentUserId
                )
              : false,
          })) : [],
        };
      }) || [];

      return {
        comments: commentsWithProcessedData || [],
        count: count || 0,
        mentionedProfiles,
      };
    },
  });

  const comments = data?.comments || [];
  const totalCommentsCount = data?.count || 0;
  const mentionedProfiles = data?.mentionedProfiles || [];

  // Helper component for recursive rendering of comments
  const renderComment = (comment: any, level: number = 0) => (
    <div key={comment.id} className={level > 0 ? "ml-8 mt-2" : ""}> {/* Indent replies */}
      <CommentCard
        comment={comment}
        currentUserId={currentUserId}
        mentionedProfiles={mentionedProfiles}
        initialLikesCount={comment.initialLikesCount}
        initialHasLiked={comment.initialHasLiked}
        onLikeStatusChange={handleLikeStatusChange}
        logId={logId}
        level={level}
      />
    </div>
  );

  // Handle real-time updates for comment likes
  useEffect(() => {
    const channel = supabase
      .channel(`comment-likes-for-log-${logId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comment_likes",
          filter: `comment_id=in.(${comments.map(c => c.id).join(',')})`,
        },
        (payload) => {
          const changedCommentId = (payload.new as any).comment_id;
          if (comments.some(c => c.id === changedCommentId)) {
            queryClient.invalidateQueries({ queryKey: ["comments", { logId, currentPage, pageSize }] });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comment_likes",
          filter: `comment_id=in.(${comments.map(c => c.id).join(',')})`,
        },
        (payload) => {
          const changedCommentId = (payload.old as any).comment_id;
          if (comments.some(c => c.id === changedCommentId)) {
            queryClient.invalidateQueries({ queryKey: ["comments", { logId, currentPage, pageSize }] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, logId, queryClient, comments, currentPage, pageSize]);

  const handleLikeStatusChange = useCallback(
    (commentId: string, newLikesCount: number, newHasLiked: boolean) => {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;

        const updatedComments = oldData.comments.map((comment: any) =>
          comment.id === commentId
            ? { ...comment, initialLikesCount: newLikesCount, initialHasLiked: newHasLiked }
            : comment
        );
        return { ...oldData, comments: updatedComments };
      });
    },
    [queryClient, queryKey]
  );

  useEffect(() => {
    const channel = supabase
      .channel(`comments-for-log-${logId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "log_comments",
          filter: `log_id=eq.${logId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comments", { logId }] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "log_comments",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comments", { logId }] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "log_comments",
          filter: `log_id=eq.${logId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comments", { logId }] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, logId, queryClient]);

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
    <div className="mt-4 space-y-2 px-4">
      {comments.length === 0 && !isLoading ? (
        <p className="text-center text-sm text-muted-foreground">
          아직 댓글이 없습니다.
        </p>
      ) : (
        comments.map((comment) => renderComment(comment))
      )}
      
      {!showPaginationButtons && totalCommentsCount > pageSize && (
        <div className="text-center mt-2">
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => router.push(`/log/${logId}`)}
          >
            다음 댓글 보기
          </Button>
        </div>
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
