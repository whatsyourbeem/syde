"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useInfiniteQuery, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CommentCard } from "@/components/comment/comment-card";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database.types";
import { LoadingSpinner } from "@/components/ui/loading-states";

interface CommentListProps {
  logId: string;
  currentUserId: string | null;
  pageSize?: number;
  isDetailPage?: boolean;
  isMobile?: boolean;
  setReplyTo?: (replyTo: { parentId: string; authorName: string; authorUsername: string | null; authorAvatarUrl: string | null; } | null) => void;
  newCommentId?: string;
  newParentCommentId?: string;
}

type CommentRow = Database['public']['Tables']['log_comments']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type CommentWithRelations = CommentRow & {
  profiles: ProfileRow | null;
  comment_likes: Array<{ user_id: string }>;
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

  const queryKey = useMemo(() => ["comments", { logId }], [logId]);

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
      const from = (pageParam - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("log_comments")
        .select(
          `
          id,
          content,
          created_at,
          updated_at,
          user_id,
          log_id,
          parent_comment_id,
          profiles!log_comments_user_id_fkey (id, username, full_name, avatar_url, updated_at, bio, link, tagline),
          comment_likes(user_id)
        `,
          { count: "exact" }
        )
        .eq("log_id", logId)
        .is('parent_comment_id', null) // Fetch only top-level comments
        .order("created_at", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }
      
      // Fetch replies for the fetched top-level comments
      const commentIds = data.map(c => c.id);
      const { data: repliesData, error: repliesError } = await supabase
        .from("log_comments")
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          log_id,
          parent_comment_id,
          profiles!log_comments_user_id_fkey (id, username, full_name, avatar_url, updated_at, bio, link, tagline),
          comment_likes(user_id)
        `)
        .in('parent_comment_id', commentIds);

      if (repliesError) {
        console.error("Error fetching replies:", repliesError);
      }

      const repliesByParentId = new Map<string, CommentWithRelations[]>();
      (repliesData || []).forEach(reply => {
        if (reply.parent_comment_id) {
          const parentReplies = repliesByParentId.get(reply.parent_comment_id) || [];
          parentReplies.push(reply as CommentWithRelations);
          repliesByParentId.set(reply.parent_comment_id, parentReplies);
        }
      });

      const commentsWithReplies = data.map(comment => ({
        ...comment,
        replies: repliesByParentId.get(comment.id) || []
      }));


      const mentionRegex = /\ \[mention:([a-f0-9\\-]+)\]/g;
      const mentionedUserIds = new Set<string>();
      [...commentsWithReplies, ...(repliesData || [])].forEach(comment => {
        const content = (comment as CommentWithRelations).content;
        if (content) {
            const matches = content.matchAll(mentionRegex);
            for (const match of matches) {
              mentionedUserIds.add(match[1]);
            }
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

      const processComment = (comment: CommentWithRelations): ProcessedComment => ({
        ...comment,
        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,
        initialLikesCount: comment.comment_likes?.length || 0,
        initialHasLiked: currentUserId ? comment.comment_likes?.some(like => like.user_id === currentUserId) : false,
        replies: (comment.replies || []).map(processComment).sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()),
      });

      const commentsWithProcessedData: ProcessedComment[] = commentsWithReplies.map(processComment);

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
  });

  const allComments = data?.pages.flatMap(page => page.comments) || [];
  const allMentionedProfiles = data?.pages.flatMap(page => page.mentionedProfiles) || [];
  const uniqueMentionedProfiles = Array.from(new Map(allMentionedProfiles.map(item => [item.id, item])).values());

  type PageData = {
    comments: ProcessedComment[];
    count: number;
    mentionedProfiles: Array<{ id: string; username: string | null }>;
    currentPage: number;
  };

  const handleLikeStatusChange = useCallback(
    (commentId: string, newLikesCount: number, newHasLiked: boolean) => {
      queryClient.setQueryData(queryKey, (oldData: InfiniteData<PageData> | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            comments: page.comments.map(comment =>
              comment.id === commentId
                ? { ...comment, initialLikesCount: newLikesCount, initialHasLiked: newHasLiked }
                : comment
            ),
          })),
        };
      });
    },
    [queryClient, queryKey]
  );

  useEffect(() => {
    const channel = supabase
      .channel(`comments-for-log-${logId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log_comments", filter: `log_id=eq.${logId}` },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment_likes" },
         () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, logId, queryClient, queryKey]);

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
    <div className="space-y-1 px-4 mb-4">
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
            logId={logId}
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
