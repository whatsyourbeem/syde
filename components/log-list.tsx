"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { LogCard } from "./log-card";
import { Button } from "./ui/button"; // Import Button component

const LOGS_PER_PAGE = 20; // Define logs per page

export function LogList({
  currentUserId,
  filterByUserId,
  filterByCommentedUserId,
  filterByLikedUserId,
  searchQuery, // Add searchQuery
}: {
  currentUserId: string | null;
  filterByUserId?: string;
  filterByCommentedUserId?: string;
  filterByLikedUserId?: string;
  searchQuery?: string; // Add searchQuery to props
}) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  const queryKey = [
    "logs",
    {
      currentPage,
      filterByUserId,
      filterByCommentedUserId,
      filterByLikedUserId,
      searchQuery, // Add to queryKey
    },
  ];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const from = (currentPage - 1) * LOGS_PER_PAGE;
      const to = from + LOGS_PER_PAGE - 1;

      let query = supabase.from("logs").select(
        `
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles (username, full_name, avatar_url, updated_at),
          log_likes(user_id),
          log_comments(id)
        `,
        { count: "exact" }
      );

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      if (filterByUserId) {
        query = query.eq("user_id", filterByUserId);
      } else if (filterByCommentedUserId) {
        const { data: commentedLogIds, error: commentedLogIdsError } =
          await supabase
            .from("log_comments")
            .select("log_id")
            .eq("user_id", filterByCommentedUserId);

        if (commentedLogIdsError) {
          throw commentedLogIdsError;
        }

        const logIds = commentedLogIds.map((item) => item.log_id);
        if (logIds.length === 0) {
          return { logs: [], count: 0 };
        }
        query = query.in("id", logIds);
      } else if (filterByLikedUserId) {
        const { data: likedLogIds, error: likedLogIdsError } = await supabase
          .from("log_likes")
          .select("log_id")
          .eq("user_id", filterByLikedUserId);

        if (likedLogIdsError) {
          throw likedLogIdsError;
        }

        const logIds = likedLogIds.map((item) => item.log_id);
        if (logIds.length === 0) {
          return { logs: [], count: 0 };
        }
        query = query.in("id", logIds);
      }

      const {
        data: logsData,
        error: logsError,
        count,
      } = await query.order("created_at", { ascending: false }).range(from, to);

      if (logsError) {
        throw logsError;
      }

      // --- Start of new logic for fetching mentioned profiles ---
      const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
      let mentionedUserIds = new Set<string>();
      logsData?.forEach(log => {
        const matches = log.content.matchAll(mentionRegex);
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

      type ProcessedLog = {
        id: string;
        content: string;
        image_url: string | null;
        created_at: string;
        user_id: string;
        profiles: {
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          updated_at: string;
        } | null;
        log_likes: Array<{ user_id: string }>;
        log_comments: Array<{ id: string }>;
        likesCount: number;
        hasLiked: boolean;
      };

      const logsWithProcessedData: ProcessedLog[] =
        logsData?.map((log: any) => ({
          ...log,
          profiles: Array.isArray(log.profiles)
            ? log.profiles[0]
            : log.profiles,
          likesCount: log.log_likes?.length || 0,
          hasLiked: currentUserId
            ? log.log_likes?.some(
                (like: any) => like.user_id === currentUserId
              ) || false
            : false,
        })) || [];

      return { logs: logsWithProcessedData || [], count: count || 0, mentionedProfiles }; // Return mentionedProfiles
    },
  });

  const logs = data?.logs || [];
  const totalLogsCount = data?.count || 0;
  const mentionedProfiles = data?.mentionedProfiles || []; // Get mentionedProfiles from data

  useEffect(() => {
    const channel = supabase
      .channel("syde-log-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log_likes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log_comments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  if (isLoading) {
    return <div className="text-center">Loading logs...</div>;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">Error: {error?.message}</div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {logs.length === 0 && !isLoading ? (
        <p className="text-center text-muted-foreground">
          아직 기록된 글이 없습니다. 첫 글을 작성해보세요!
        </p>
      ) : (
        logs.map((log) => (
          <LogCard
            key={log.id}
            log={log}
            currentUserId={currentUserId}
            initialLikesCount={log.likesCount}
            initialHasLiked={log.hasLiked}
            initialCommentsCount={log.log_comments.length}
            mentionedProfiles={mentionedProfiles} // Pass mentionedProfiles to LogCard
          />
        ))
      )}
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from(
          { length: Math.ceil(totalLogsCount / LOGS_PER_PAGE) },
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
