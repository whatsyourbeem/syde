"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CommentCard } from "./comment-card";

interface CommentListProps {
  logId: string;
  currentUserId: string | null;
}

export function CommentList({ logId, currentUserId }: CommentListProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("log_comments")
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        profiles (username, full_name, avatar_url, updated_at)
      `
      )
      .eq("log_id", logId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      setError(error.message);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();

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
        async (payload) => {
          const newComment = payload.new;
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url, updated_at")
            .eq("id", newComment.user_id)
            .single();

          if (profileError) {
            console.error("Error fetching profile for new comment:", profileError);
            fetchComments(); // Fallback to refetching all
          } else {
            const formattedComment = {
              ...newComment,
              profiles: profileData,
            };
            setComments((currentComments) => [...currentComments, formattedComment]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "log_comments",
        },
        (payload) => {
          // Assuming the channel `comments-for-log-${logId}` only receives DELETE events
          // for comments belonging to this logId. payload.old.log_id is not available.
          setComments((currentComments) =>
            currentComments.filter((comment) => comment.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, logId]);

  if (loading) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        Loading comments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-sm text-red-500">Error: {error}</div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          아직 댓글이 없습니다.
        </p>
      ) : (
        comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
          />
        ))
      )}
    </div>
  );
}
