"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CommentCard } from "./comment-card";
import { Button } from "./ui/button";

const COMMENTS_PER_PAGE = 10;

interface CommentListProps {
  logId: string;
  currentUserId: string | null;
}

export function CommentList({ logId, currentUserId }: CommentListProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  const queryKey = ["comments", { logId, currentPage }];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const from = (currentPage - 1) * COMMENTS_PER_PAGE;
      const to = from + COMMENTS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from("log_comments")
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          log_id,
          profiles!log_comments_user_id_fkey (username, full_name, avatar_url, updated_at),
          comment_likes(user_id) // Fetch comment likes
        `,
          { count: "exact" }
        )
        .eq("log_id", logId)
        .order("created_at", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
      let mentionedUserIds = new Set<string>();
      data?.forEach(comment => {
        const matches = comment.content.matchAll(mentionRegex);
        for (const match of matches) {
          mentionedUserIds.add(match[1]);
        }
      });

      let mentionedProfiles: any[] = [];
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

      const commentsWithProcessedData = data?.map((comment) => {
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
        };
      }) as Array<any>; // Use any for now, can refine type later

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
          // Invalidate only if the change is relevant to the current page's comments
          const changedCommentId = (payload.new as any).comment_id;
          if (comments.some(c => c.id === changedCommentId)) {
            queryClient.invalidateQueries({ queryKey: ["comments", { logId, currentPage }] });
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
            queryClient.invalidateQueries({ queryKey: ["comments", { logId, currentPage }] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, logId, queryClient, comments]); // Add comments to dependencies

  // Handle like status change from CommentCard
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
        Loading comments...
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
        comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            mentionedProfiles={mentionedProfiles}
            initialLikesCount={comment.initialLikesCount}
            initialHasLiked={comment.initialHasLiked}
            onLikeStatusChange={handleLikeStatusChange}
          />
        ))
      )}
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from(
          { length: Math.ceil(totalCommentsCount / COMMENTS_PER_PAGE) },
          (_, i) => (
            <Button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              variant={currentPage === i + 1 ? "default" : "outline"}
              disabled={isLoading}
            >
              {i + 1}
            </Button>
          )
        )}
      </div>
    </div>
  );
}