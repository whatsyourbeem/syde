"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CommentCard } from "./comment-card";
import { Button } from './ui/button'; // Import Button component

const COMMENTS_PER_PAGE = 10; // Define comments per page

interface CommentListProps {
  logId: string;
  currentUserId: string | null;
}

export function CommentList({ logId, currentUserId }: CommentListProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [totalCommentsCount, setTotalCommentsCount] = useState(0); // Total comments count state

  const fetchComments = async () => {
    setLoading(true);
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
        { count: 'exact' }
      )
      .eq("log_id", logId)
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching comments:", error);
      setError(error.message);
    } else {
      setComments(data || []);
      setTotalCommentsCount(count || 0);
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
          fetchComments(); // Re-fetch all comments on delete
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
        (payload) => {
          setComments((currentComments) =>
            currentComments.map((comment) =>
              comment.id === payload.new.id ? { ...comment, content: payload.new.content } : comment
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, logId, currentPage]); // Added currentPage to dependency array

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
      {comments.length === 0 && !loading ? (
        <p className="text-center text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
      ) : (
        comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
          />
        ))
      )}
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from({ length: Math.ceil(totalCommentsCount / COMMENTS_PER_PAGE) }, (_, i) => (
          <Button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            variant={currentPage === i + 1 ? "default" : "outline"}
            disabled={loading}
          >
            {i + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}
