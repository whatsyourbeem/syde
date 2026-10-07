import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { PublicProfile } from "@/types/profile";
import { getOptimizedLogs, OptimizedLog, LogQueryOptions, LogQueryResult } from "./log-queries";
import { getPlainTextFromTiptapJson } from "@/lib/utils";
import type { ShowcaseStatus } from "@/lib/constants";

type ProfileRow = PublicProfile;
type ActivityFeedRow = Database["public"]["Tables"]["activity_feed"]["Row"];

// ===== Activity Feed Types =====

export type ActivityType =
  | "SHOWCASE_CREATED"
  | "SHOWCASE_BUMPED"
  | "BLOG_POST_CREATED"
  | "MEETUP_CREATED";

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  target_id: string | null;
  created_at: string;
  profiles: ProfileRow | null;
  details?: {
    showcase?: {
      title: string | null;
      short_description: string | null;
      thumbnail_url: string | null;
      views_count?: number | null;
      status?: ShowcaseStatus | null;
    };
    blogPost?: {
      title: string | null;
      summary: string | null;
      image_url: string | null;
      content_preview?: string | null;
    };
    meetup?: {
      title: string | null;
      thumbnail_url: string | null;
      start_datetime: string | null;
      location: string | null;
      club_name?: string | null;
      organizer_name?: string | null;
    };
  };
}

// ===== Unified Feed Types =====

export interface LogFeedItem {
  feed_type: "log";
  created_at: string;
  data: OptimizedLog;
}

export interface ActivityFeedEntry {
  feed_type: "activity";
  created_at: string;
  data: ActivityFeedItem;
}

export type FeedItem = LogFeedItem | ActivityFeedEntry;

export interface FeedQueryResult {
  items: FeedItem[];
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  /** 다음 페이지를 불러올 때 쓸 커서(마지막 항목의 created_at). 더 없으면 null. */
  nextCursor: string | null;
}

// ===== Activity Message Helpers =====

export function getActivityMessage(
  activity: ActivityFeedItem,
  displayName: string
): string {
  const title = activity.details?.showcase?.title || 
                activity.details?.blogPost?.title || 
                activity.details?.meetup?.title;

  switch (activity.activity_type) {
    case "SHOWCASE_CREATED":
      return `${displayName}님이 쇼케이스를 등록했어요`;
    case "SHOWCASE_BUMPED":
      return `${displayName}님이 쇼케이스를 끌어올렸어요`;
    case "BLOG_POST_CREATED":
      return `${displayName}님이 블로그 글을 발행했어요`;
    case "MEETUP_CREATED":
      return title
        ? `${displayName}님이 '${title}' 모임을 개설했어요`
        : `${displayName}님이 모임을 개설했어요`;
    default:
      return `${displayName}님의 새로운 활동이 있어요`;
  }
}

export function getActivityLink(activity: ActivityFeedItem): string | null {
  switch (activity.activity_type) {
    case "SHOWCASE_CREATED":
    case "SHOWCASE_BUMPED":
      return activity.target_id ? `/showcase/${activity.target_id}` : null;
    case "BLOG_POST_CREATED":
      return activity.target_id ? `/blog/${activity.target_id}` : null;
    case "MEETUP_CREATED":
      return activity.target_id ? `/meetup/${activity.target_id}` : null;
    default:
      return null;
  }
}

export function getActivityEmoji(activityType: ActivityType): string {
  switch (activityType) {
    case "SHOWCASE_CREATED":
      return "🚀";
    case "SHOWCASE_BUMPED":
      return "⬆️";
    case "BLOG_POST_CREATED":
      return "💡";
    case "MEETUP_CREATED":
      return "📢";
    default:
      return "✨";
  }
}

// ===== Feed Query Functions =====

interface FeedQueryOptions extends LogQueryOptions {
  includeActivities?: boolean;
}

/**
 * Fetch the unified feed: logs + activity_feed merged by time.
 *
 * Strategy: For the general feed (no special filters like search, commented, liked, bookmarked),
 * we fetch both logs and activities, merge them by created_at, and paginate the combined result.
 *
 * For filtered feeds (search, user-specific filters), we only include activities
 * when filtering by user (filterByUserId), not for search/commented/liked/bookmarked filters.
 */
export async function getUnifiedFeed(
  supabase: SupabaseClient<Database>,
  options: FeedQueryOptions
): Promise<FeedQueryResult> {
  const {
    currentUserId,
    cursor,
    logsPerPage,
    filterByUserId,
    filterByCommentedUserId,
    filterByLikedUserId,
    filterByBookmarkedUserId,
    searchQuery,
    includeActivities = true,
  } = options;

  // Determine whether to include activities
  const shouldIncludeActivities =
    includeActivities &&
    !searchQuery &&
    !filterByCommentedUserId &&
    !filterByLikedUserId &&
    !filterByBookmarkedUserId;

  if (!shouldIncludeActivities) {
    // Just return regular logs (no activities)
    const logResult = await getOptimizedLogs(supabase, options);
    return {
      items: logResult.logs.map((log) => ({
        feed_type: "log" as const,
        created_at: log.created_at || new Date().toISOString(),
        data: log,
      })),
      mentionedProfiles: logResult.mentionedProfiles,
      nextCursor: logResult.nextCursor,
    };
  }

  // ==== Unified feed: fetch both logs and activities ====

  // We need to fetch more than a page's worth and merge.
  // Strategy: Use a DB function or fetch both with generous limits and merge client-side.
  // Here we use the client-side merge approach for simplicity.

  // Step 1: 두 테이블에서 커서 이전 항목을 created_at DESC로 가져온다.
  // 합친 결과의 상위 N개는 각 테이블의 상위 N개 안에 반드시 있으므로,
  // 테이블마다 N+1개(다음 페이지 존재 여부 확인용)만 가져오면 된다.
  const logSelectQuery = `
    id,
    content,
    image_url,
    created_at,
    updated_at,
    user_id,
    profiles:user_id (id, username, full_name, avatar_url, updated_at, tagline, bio, link, certified),
    log_bookmarks(user_id),
    log_comments(id),
    likes_count:log_likes(count)
  `;

  let logsQuery = supabase
    .from("logs")
    .select(logSelectQuery)
    .order("created_at", { ascending: false });

  let activitiesQuery = supabase
    .from("activity_feed")
    .select(`
      id,
      user_id,
      activity_type,
      target_id,
      created_at,
      profiles:user_id (id, username, full_name, avatar_url, updated_at, tagline, bio, link, certified)
    `)
    .order("created_at", { ascending: false });

  if (filterByUserId) {
    logsQuery = logsQuery.eq("user_id", filterByUserId);
    activitiesQuery = activitiesQuery.eq("user_id", filterByUserId) as typeof activitiesQuery;
  }

  if (cursor) {
    logsQuery = logsQuery.lt("created_at", cursor);
    activitiesQuery = activitiesQuery.lt("created_at", cursor) as typeof activitiesQuery;
  }

  // Fetch liked log IDs for "hasLiked" computation
  let likedLogIdsSet = new Set<string>();
  if (currentUserId) {
    const { data: likedLogs } = await supabase
      .from("log_likes")
      .select("log_id")
      .eq("user_id", currentUserId);
    if (likedLogs) {
      likedLogIdsSet = new Set(
        likedLogs.map((like) => like.log_id).filter((id): id is string => id !== null)
      );
    }
  }

  const fetchLimit = logsPerPage + 1;

  const [logsResult, activitiesResult] = await Promise.all([
    logsQuery.limit(fetchLimit),
    activitiesQuery.limit(fetchLimit),
  ]);

  if (logsResult.error) throw logsResult.error;
  if (activitiesResult.error) throw activitiesResult.error;

  // Process logs
  const processedLogs: FeedItem[] = (logsResult.data || []).map((log) => {
    const profiles = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
    const likesCount = (log.likes_count as Array<{ count: number }> | null)?.[0]?.count || 0;
    const logBookmarks = (log.log_bookmarks as Array<{ user_id: string }>) || [];
    const logComments = (log.log_comments as Array<{ id: string }>) || [];

    const optimizedLog: OptimizedLog = {
      id: log.id,
      content: log.content,
      image_url: log.image_url,
      created_at: log.created_at,
      updated_at: log.updated_at,
      user_id: log.user_id,
      profiles: profiles as OptimizedLog["profiles"],
      log_likes: [],
      log_bookmarks: logBookmarks,
      log_comments: logComments,
      likesCount: likesCount,
      hasLiked: likedLogIdsSet.has(log.id),
      bookmarksCount: logBookmarks.length,
      hasBookmarked: currentUserId
        ? logBookmarks.some((b) => b.user_id === currentUserId)
        : false,
    };

    return {
      feed_type: "log" as const,
      created_at: log.created_at || new Date().toISOString(),
      data: optimizedLog,
    };
  });

  // Process activities
  const activityDataItems = (activitiesResult.data || []) as Array<ActivityFeedRow & { profiles: ProfileRow | ProfileRow[] | null }>;
  const processedActivities: FeedItem[] = activityDataItems.map((activity) => {
    const profiles = Array.isArray(activity.profiles)
      ? activity.profiles[0]
      : activity.profiles;

    return {
      feed_type: "activity" as const,
      created_at: activity.created_at,
      data: {
        id: activity.id,
        user_id: activity.user_id,
        activity_type: activity.activity_type as ActivityType,
        target_id: activity.target_id,
        created_at: activity.created_at,
        profiles: profiles as ProfileRow | null,
      },
    };
  });

  // Step 4: Fetch details for activities (previews)
  const activitiesWithIds = processedActivities
    .filter((item): item is ActivityFeedEntry => item.feed_type === "activity")
    .map(item => item.data);
  
  if (activitiesWithIds.length > 0) {
    await fetchActivityDetails(supabase, activitiesWithIds);
  }

  // Step 5: Merge and sort by created_at DESC
  const allItems = [...processedLogs, ...processedActivities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Paginate
  const hasMore = allItems.length > logsPerPage;
  const pageItems = allItems.slice(0, logsPerPage);

  // Extract mentioned profiles from logs on this page
  const logItems = pageItems.filter(
    (item): item is LogFeedItem => item.feed_type === "log"
  );
  const mentionedProfiles = await getMentionedProfilesFromLogs(
    supabase,
    logItems.map((item) => item.data)
  );

  return {
    items: pageItems,
    mentionedProfiles,
    nextCursor: hasMore ? pageItems[pageItems.length - 1]?.created_at ?? null : null,
  };
}

/**
 * Fetch detailed information for activities to show previews
 */
async function fetchActivityDetails(
  supabase: SupabaseClient<Database>,
  activities: ActivityFeedItem[]
) {
  const showcaseIds = activities
    .filter(a => (a.activity_type === "SHOWCASE_CREATED" || a.activity_type === "SHOWCASE_BUMPED") && a.target_id)
    .map(a => a.target_id as string);
  
  const postIds = activities
    .filter(a => a.activity_type === "BLOG_POST_CREATED" && a.target_id)
    .map(a => a.target_id as string);
  
  const meetupIds = activities
    .filter(a => a.activity_type === "MEETUP_CREATED" && a.target_id)
    .map(a => a.target_id as string);

  const [showcases, blogPosts, meetups] = await Promise.all([
    showcaseIds.length > 0
      ? supabase.from("showcases").select("id, name, short_description, thumbnail_url, views_count, status").in("id", showcaseIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from("blog_posts").select("id, title, summary, image_url, content").in("id", postIds)
      : Promise.resolve({ data: [] }),
    meetupIds.length > 0
      ? supabase.from("meetups").select(`
          id, 
          title, 
          thumbnail_url, 
          start_datetime, 
          location,
          club_id,
          organizer_id,
          profiles:organizer_id(full_name),
          clubs:club_id(name)
        `).in("id", meetupIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Map details back to activities
  activities.forEach(activity => {
    if (activity.activity_type === "SHOWCASE_CREATED" || activity.activity_type === "SHOWCASE_BUMPED") {
      const detail = showcases.data?.find(s => s.id === activity.target_id);
      if (detail) {
        activity.details = {
          showcase: {
            title: detail.name,
            short_description: detail.short_description,
            thumbnail_url: detail.thumbnail_url,
            views_count: detail.views_count,
            status: detail.status,
          }
        };
      }
    } else if (activity.activity_type === "BLOG_POST_CREATED") {
      const detail = blogPosts.data?.find(i => i.id === activity.target_id);
      if (detail) {
        activity.details = {
          blogPost: {
            title: detail.title,
            summary: detail.summary,
            image_url: detail.image_url,
            content_preview: getPlainTextFromTiptapJson(detail.content),
          }
        };
      }
    }
 else if (activity.activity_type === "MEETUP_CREATED") {
      const detail = meetups.data?.find(m => m.id === activity.target_id);
      if (detail) {
        const organizer = Array.isArray(detail.profiles) ? detail.profiles[0] : detail.profiles;
        const club = Array.isArray(detail.clubs) ? detail.clubs[0] : detail.clubs;
        
        activity.details = {
          meetup: {
            title: detail.title,
            thumbnail_url: detail.thumbnail_url,
            start_datetime: detail.start_datetime,
            location: detail.location,
            organizer_name: organizer?.full_name,
            club_name: club?.name,
          }
        };
      }
    }
  });
}

/**
 * Batch fetch mentioned profiles from log content
 */
async function getMentionedProfilesFromLogs(
  supabase: SupabaseClient<Database>,
  logs: Array<{ content: string }>
): Promise<Array<{ id: string; username: string | null }>> {
  const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
  const mentionedUserIds = new Set<string>();

  logs.forEach((log) => {
    const matches = log.content.matchAll(mentionRegex);
    for (const match of matches) {
      mentionedUserIds.add(match[1]);
    }
  });

  if (mentionedUserIds.size === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", Array.from(mentionedUserIds));

  if (error) {
    console.error("Error fetching mentioned profiles:", error);
    return [];
  }

  return data || [];
}
