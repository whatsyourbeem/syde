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
      searchQuery,
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
          profiles (username, full_name, avatar_url, updated_at, tagline),
          log_likes(user_id),
          log_comments(id)
        `,
        { count: "exact" }
      );

      if (searchQuery) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let finalSearchConditions: string[] = [];

        // 1. Check for matching profiles (username or full_name)
        const { data: matchingProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username')
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);

        if (profileError) {
          console.error("Error fetching matching profiles for search:", profileError);
        } else if (matchingProfiles && matchingProfiles.length > 0) {
          // If profiles match, search only for their mentions
          const mentionConditions = matchingProfiles.map(profile => 
            `content.ilike.%[mention:${profile.id}]%`
          );
          finalSearchConditions.push(...mentionConditions);
        } else if (searchQuery.toLowerCase() === 'mention' || uuidRegex.test(searchQuery)) {
          // If no profile matches AND search query is 'mention' or a UUID, return no results
          // By not adding any conditions, the query will effectively return nothing if no other filters apply
        } else {
          // Otherwise, perform a general text search
          finalSearchConditions.push(`content.ilike.%${searchQuery}%`);
        }

        if (finalSearchConditions.length > 0) {
          query = query.or(finalSearchConditions.join(','));
        } else {
          // If no valid search conditions, ensure no results are returned
          query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // A non-existent ID
        }
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
      logsData?.forEach((log) => {
        const matches = log.content.matchAll(mentionRegex);
        for (const match of matches) {
          mentionedUserIds.add(match[1]);
        }
      });

      let mentionedProfiles: any[] = [];
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
          tagline: string | null;
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

      return {
        logs: logsWithProcessedData || [],
        count: count || 0,
        mentionedProfiles,
      }; // Return mentionedProfiles
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
        {
          event: "*",
          schema: "public",
          table: "log_likes",
          filter: `log_id=in.(${logs.map(log => log.id).join(',')})`,
        },
        (payload) => {
          // Invalidate only if the change is relevant to the current page's logs
          const changedLogId = (payload.new as any).log_id || (payload.old as any).log_id;
          if (logs.some(log => log.id === changedLogId)) {
            queryClient.invalidateQueries({ queryKey: ["logs"] });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "log_comments",
          filter: `log_id=in.(${logs.map(log => log.id).join(',')})`,
        },
        (payload) => {
          const changedLogId = (payload.new as any).log_id || (payload.old as any).log_id;
          if (logs.some(log => log.id === changedLogId)) {
            queryClient.invalidateQueries({ queryKey: ["logs"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, logs]); // Add logs to dependencies

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
            searchQuery={searchQuery} // Pass searchQuery to LogCard
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