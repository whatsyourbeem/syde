"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { LogCard } from "@/components/log/log-card";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database.types";

type LogRow = Database["public"]["Tables"]["logs"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProcessedLog = LogRow & {
  profiles: ProfileRow | null;
  log_likes: Array<{ user_id: string }>;
  log_comments: Array<{ id: string }>;
  likesCount: number;
  hasLiked: boolean;
};

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
          profiles (id, username, full_name, avatar_url, updated_at, tagline, bio, link),
          log_likes(user_id),
          log_comments(id)
        `,
        { count: "exact" }
      );

      if (searchQuery) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const finalSearchConditions: string[] = [];

        // 1. Check for matching profiles (username or full_name)
        const { data: matchingProfiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, username")
          .or(
            `username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`
          );

        if (profileError) {
          console.error(
            "Error fetching matching profiles for search:",
            profileError
          );
        } else if (matchingProfiles && matchingProfiles.length > 0) {
          // If profiles match, search only for their mentions
          const mentionConditions = matchingProfiles.map(
            (profile) => `content.ilike.%[mention:${profile.id}]%`
          );
          finalSearchConditions.push(...mentionConditions);
        } else if (
          searchQuery.toLowerCase() === "mention" ||
          uuidRegex.test(searchQuery)
        ) {
          // If no profile matches AND search query is 'mention' or a UUID, return no results
          // By not adding any conditions, the query will effectively return nothing if no other filters apply
        } else {
          // Otherwise, perform a general text search
          finalSearchConditions.push(`content.ilike.%${searchQuery}%`);
        }

        if (finalSearchConditions.length > 0) {
          query = query.or(finalSearchConditions.join(","));
        } else {
          // If no valid search conditions, ensure no results are returned
          query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // A non-existent ID
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
        // null 값을 필터링하여 제거
        const validLogIds = logIds.filter((id): id is string => id !== null);

        // 이제 validLogIds는 string[] 타입이므로 안전하게 사용 가능
        query = query.in("id", validLogIds);
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
        // null 값을 필터링하여 제거
        const validLogIds = logIds.filter((id): id is string => id !== null);

        // 이제 validLogIds는 string[] 타입이므로 안전하게 사용 가능
        query = query.in("id", validLogIds);
      }

      type LogQueryResult = (LogRow & {
        profiles: ProfileRow | null;
        log_likes: Array<{ user_id: string }>;
        log_comments: Array<{ id: string }>;
      })[];

      const {
        data: logsData,
        error: logsError,
        count,
      } = (await query
        .order("created_at", { ascending: false })
        .range(from, to)) as {
        data: LogQueryResult | null;
        error: PostgrestError | null;
        count: number | null;
      };

      if (logsError) {
        throw logsError;
      }

      // --- Start of new logic for fetching mentioned profiles ---
      const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
      const mentionedUserIds = new Set<string>();
      logsData?.forEach((log) => {
        const matches = log.content.matchAll(mentionRegex);
        for (const match of matches) {
          mentionedUserIds.add(match[1]);
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
      // --- End of new logic ---

      const logsWithProcessedData: ProcessedLog[] =
        logsData?.map((log: LogRow & { profiles: ProfileRow | null; log_likes: Array<{ user_id: string }>; log_comments: Array<{ id: string }>; }) => ({
          ...log,
          profiles: Array.isArray(log.profiles)
            ? log.profiles[0]
            : log.profiles,
          likesCount: log.log_likes?.length || 0,
          hasLiked: currentUserId
            ? log.log_likes?.some(
                (like: { user_id: string }) => like.user_id === currentUserId
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

  const logs: ProcessedLog[] = useMemo(() => data?.logs || [], [data?.logs]);
  const totalLogsCount = data?.count || 0;
  const mentionedProfiles = data?.mentionedProfiles || []; // Get mentionedProfiles from data

  useEffect(() => {
    const logIdsForFilter: string[] = logs
      .map((log) => log.id)
      .filter((id): id is string => id !== null);

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
          filter: `log_id=in.(${logIdsForFilter.join(",")})`,
        },
        (payload) => {
          // Invalidate only if the change is relevant to the current page's logs
          const changedLogId =
            (payload.new as Database['public']['Tables']['log_likes']['Row']).log_id || (payload.old as Database['public']['Tables']['log_likes']['Row']).log_id;
          if (logs.some((log) => log.id === changedLogId)) {
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
          filter: `log_id=in.(${logIdsForFilter.join(",")})`,
        },
        (payload) => {
          const changedLogId =
            (payload.new as Database['public']['Tables']['log_comments']['Row']).log_id || (payload.old as Database['public']['Tables']['log_comments']['Row']).log_id;
          if (logs.some((log) => log.id === changedLogId)) {
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
    return <div className="text-center mt-8">로그를 불러오는 중...</div>;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">Error: {error?.message}</div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 px-6 py-3">
      {logs.length === 0 && !isLoading ? (
        <p className="text-center text-muted-foreground">
          아직 기록된 글이 없습니다. 첫 글을 작성해보세요!
        </p>
      ) : (
        logs.map((log, index) => (
          <div key={log.id}>
            <LogCard
              log={log}
              currentUserId={currentUserId}
              initialLikesCount={log.likesCount}
              initialHasLiked={log.hasLiked}
              initialCommentsCount={log.log_comments.length}
              mentionedProfiles={mentionedProfiles} // Pass mentionedProfiles to LogCard
              searchQuery={searchQuery} // Pass searchQuery to LogCard
            />
            {index < logs.length - 1 && (
              <div className="border-b border-gray-200 my-4"></div>
            )}
          </div>
        ))
      )}
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from(
          { length: Math.ceil(totalLogsCount / LOGS_PER_PAGE) },
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
    </div>
  );
}
