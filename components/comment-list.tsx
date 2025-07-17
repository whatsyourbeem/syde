"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CommentCard } from "./comment-card";
import { Button } from "./ui/button"; // Import Button component

const COMMENTS_PER_PAGE = 10; // Define comments per page

interface CommentListProps {
  logId: string;
  currentUserId: string | null;
}

export function CommentList({ logId, currentUserId }: CommentListProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1); // Current page state

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
          profiles (username, full_name, avatar_url, updated_at)
        `,
          { count: "exact" }
        )
        .eq("log_id", logId)
        .order("created_at", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      // --- Start of new logic for fetching mentioned profiles ---
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
      // --- End of new logic ---

      const commentsWithProcessedProfiles = data?.map((comment) => ({
        ...comment,
        profiles: Array.isArray(comment.profiles)
          ? comment.profiles[0]
          : comment.profiles,
      })) as Array<{
        id: string;
        content: string;
        created_at: string;
        user_id: string;
        log_id: string;
        profiles: {
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          updated_at: string;
        } | null;
      }>;

      return {
        comments: commentsWithProcessedProfiles || [],
        count: count || 0,
        mentionedProfiles,
      };
    },
  });

  const comments = data?.comments || [];
  const totalCommentsCount = data?.count || 0;
  const mentionedProfiles = data?.mentionedProfiles || [];

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
          event: "UPDATE", // Listen for UPDATE events
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
