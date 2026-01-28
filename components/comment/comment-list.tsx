"use client";

import { useEffect, useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CommentCard } from "@/components/comment/comment-card";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database.types";
import { LoadingSpinner } from "@/components/ui/loading-states";

interface CommentListProps {
  logId?: string;
  showcaseId?: string;
  currentUserId: string | null;
  pageSize?: number;
  isDetailPage?: boolean;
  isMobile?: boolean;
  setReplyTo?: (
    replyTo: {
      parentId: string;
      authorName: string;
      authorUsername: string | null;
      authorAvatarUrl: string | null;
    } | null,
  ) => void;
  newCommentId?: string;
  newParentCommentId?: string;
}

type CommentRow = Database["public"]["Tables"]["log_comments"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type CommentWithRelations = CommentRow & {
  profiles: ProfileRow | null;
  comment_likes?: Array<{ user_id: string }>; // For log comments
  showcase_likes?: Array<{ user_id: string }>; // For showcase comments
  replies?: CommentWithRelations[];
};

type ProcessedComment = CommentRow & {
  profiles: ProfileRow | null;
  comment_likes: Array<{ user_id: string }>;
  initialLikesCount: number;
  initialHasLiked: boolean;
  replies?: ProcessedComment[];
};

export function CommentList({
  logId,
  showcaseId,
  currentUserId,
  pageSize = 10, // Changed to 10 as requested
  isDetailPage = false,
  isMobile = false,
  setReplyTo,
  newCommentId,
  newParentCommentId,
}: CommentListProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const parentId = logId || showcaseId;
  const parentTable = logId ? "log_comments" : "showcase_comments";
  const parentColumn = logId ? "log_id" : "showcase_id";
  const channelName = logId
    ? `comments-for-log-${logId}`
    : `comments-for-showcase-${showcaseId}`;

  const queryKey = useMemo(() => ["comments", { parentId }], [parentId]);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      if (!parentId) {
        return {
          comments: [],
          count: 0,
          mentionedProfiles: [],
          currentPage: pageParam,
        };
      }

      const from = (pageParam - 1) * pageSize;
      const to = from + pageSize - 1;

      // Determine which likes relation to fetch
      const likesRelation =
        parentTable === "log_comments"
          ? "comment_likes(user_id)"
          : "showcase_likes!showcase_likes_comment_id_fkey(user_id)";

      const { data, error, count } = await supabase
        .from(parentTable)
        .select(
          `
          id,
          content,
          created_at,
          updated_at,
          user_id,
          ${parentColumn},
          parent_comment_id,
          profiles!${parentTable}_user_id_fkey (id, username, full_name, avatar_url, updated_at, bio, link, tagline, certified),
          ${likesRelation}
        `,
          { count: "exact" },
        )
        .eq(parentColumn, parentId)
        .is("parent_comment_id", null) // Fetch only top-level comments
        .order("created_at", { ascending: true })
        .range(from, to)
        .returns<CommentWithRelations[]>();

      if (error) {
        throw error;
      }

      // Fetch replies for the fetched top-level comments
      const commentIds = data.map((c) => c.id);
      const { data: repliesData, error: repliesError } = await supabase
        .from(parentTable)
        .select(
          `
          id,
          content,
          created_at,
          updated_at,
          user_id,
          ${parentColumn},
          parent_comment_id,
          profiles!${parentTable}_user_id_fkey (id, username, full_name, avatar_url, updated_at, bio, link, tagline, certified),
          ${likesRelation}
        `,
        )
        .in("parent_comment_id", commentIds)
        .returns<CommentWithRelations[]>();

      if (repliesError) {
        console.error("Error fetching replies:", repliesError);
      }

      const repliesByParentId = new Map<string, CommentWithRelations[]>();
      (repliesData || []).forEach((reply) => {
        if (reply.parent_comment_id) {
          const parentReplies =
            repliesByParentId.get(reply.parent_comment_id) || [];
          parentReplies.push(reply as CommentWithRelations);
          repliesByParentId.set(reply.parent_comment_id, parentReplies);
        }
      });

      const commentsWithReplies = data.map((comment) => ({
        ...comment,
        replies: repliesByParentId.get(comment.id) || [],
      }));

      const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
      const mentionedUserIds = new Set<string>();
      [...commentsWithReplies, ...(repliesData || [])].forEach((comment) => {
        const content = (comment as CommentWithRelations).content;
        if (content) {
          const matches = content.matchAll(mentionRegex);
          for (const match of matches) {
            mentionedUserIds.add(match[1]);
          }
        }
      });

      let mentionedProfiles: Array<{ id: string; username: string | null }> =
        [];
      if (mentionedUserIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", Array.from(mentionedUserIds));

        if (profilesError) {
          console.error("Error fetching mentioned profiles:", profilesError);
        } else {
          mentionedProfiles = profilesData;
        }
      }

      const processComment = (
        comment: CommentWithRelations,
      ): ProcessedComment => {
        // Get likes from appropriate field based on comment type
        const likes = comment.comment_likes || comment.showcase_likes || [];
        return {
          ...comment,
          profiles: Array.isArray(comment.profiles)
            ? comment.profiles[0]
            : comment.profiles,
          comment_likes: likes,
          initialLikesCount: likes.length,
          initialHasLiked: currentUserId
            ? likes.some((like) => like.user_id === currentUserId)
            : false,
          replies: (comment.replies || [])
            .map(processComment)
            .sort(
              (a, b) =>
                new Date(a.created_at!).getTime() -
                new Date(b.created_at!).getTime(),
            ),
        };
      };

      const commentsWithProcessedData: ProcessedComment[] =
        commentsWithReplies.map(processComment);

      return {
        comments: commentsWithProcessedData,
        count: count || 0,
        mentionedProfiles,
        currentPage: pageParam,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentItems = lastPage.currentPage * pageSize;
      if (currentItems < lastPage.count) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    enabled: !!parentId,
  });

  const allComments = data?.pages.flatMap((page) => page.comments) || [];
  const allMentionedProfiles =
    data?.pages.flatMap((page) => page.mentionedProfiles) || [];
  const uniqueMentionedProfiles = Array.from(
    new Map(allMentionedProfiles.map((item) => [item.id, item])).values(),
  );

  type PageData = {
    comments: ProcessedComment[];
    count: number;
    mentionedProfiles: Array<{ id: string; username: string | null }>;
    currentPage: number;
  };

  const handleLikeStatusChange = useCallback(
    (commentId: string, newLikesCount: number, newHasLiked: boolean) => {
      queryClient.setQueryData(
        queryKey,
        (oldData: InfiniteData<PageData> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              comments: page.comments.map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      initialLikesCount: newLikesCount,
                      initialHasLiked: newHasLiked,
                    }
                  : comment,
              ),
            })),
          };
        },
      );
    },
    [queryClient, queryKey],
  );

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: parentTable,
          filter: `${parentColumn}=eq.${parentId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment_likes" },
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "showcase_likes" },
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    supabase,
    parentId,
    queryClient,
    queryKey,
    parentTable,
    parentColumn,
    channelName,
  ]);

  useEffect(() => {
    if (newCommentId) {
      queryClient.resetQueries({ queryKey: queryKey });
    }
  }, [newCommentId, queryClient, queryKey]);

  if (isLoading) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-sm text-red-500 p-4">
        Error: {error?.message}
      </div>
    );
  }

  return (
    <div className="space-y-1 mb-4">
      {allComments.length === 0 && !isLoading ? (
        <p className="text-center text-sm text-muted-foreground my-4">
          아직 댓글이 없습니다.
        </p>
      ) : (
        allComments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            mentionedProfiles={uniqueMentionedProfiles}
            initialLikesCount={comment.initialLikesCount}
            initialHasLiked={comment.initialHasLiked}
            onLikeStatusChange={handleLikeStatusChange}
            logId={logId} // Pass logId if available
            showcaseId={showcaseId} // Pass showcaseId if available
            level={0}
            isDetailPage={isDetailPage}
            isMobile={isMobile}
            setReplyTo={setReplyTo}
            newCommentId={newCommentId}
            newParentCommentId={newParentCommentId}
            userId={comment.user_id} // Pass the comment's user_id as userId
            isLiked={comment.initialHasLiked} // Pass the comment's initialHasLiked as isLiked
            likeCount={comment.initialLikesCount} // Pass the comment's initialLikesCount as likeCount
          />
        ))
      )}

      {hasNextPage && (
        <div className="text-center mt-2">
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "다음 댓글 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}
