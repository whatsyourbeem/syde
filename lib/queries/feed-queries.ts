import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { getOptimizedLogs, OptimizedLog, LogQueryOptions, LogQueryResult } from "./log-queries";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// Raw activity_feed row type (table not yet in database.types.ts until migration is applied)
interface ActivityFeedRow {
  id: string;
  user_id: string;
  activity_type: string;
  target_id: string | null;
  created_at: string;
}

// ===== Activity Feed Types =====

export type ActivityType =
  | "SHOWCASE_CREATED"
  | "INSIGHT_CREATED"
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
    };
    insight?: {
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
  totalCount: number;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
}

// ===== Activity Message Helpers =====

export function getActivityMessage(
  activity: ActivityFeedItem,
  displayName: string
): string {
  const title = activity.details?.showcase?.title || 
                activity.details?.insight?.title || 
                activity.details?.meetup?.title;

  switch (activity.activity_type) {
    case "SHOWCASE_CREATED":
      return `${displayName}님이 쇼케이스를 등록했어요`;
    case "INSIGHT_CREATED":
      return `${displayName}님이 인사이트를 등록했어요`;
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
      return activity.target_id ? `/showcase/${activity.target_id}` : null;
    case "INSIGHT_CREATED":
      return activity.target_id ? `/insight/${activity.target_id}` : null;
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
    case "INSIGHT_CREATED":
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
    currentPage,
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
      totalCount: logResult.count,
      mentionedProfiles: logResult.mentionedProfiles,
    };
  }

  // ==== Unified feed: fetch both logs and activities ====

  // We need to fetch more than a page's worth and merge.
  // Strategy: Use a DB function or fetch both with generous limits and merge client-side.
  // Here we use the client-side merge approach for simplicity.

  // Step 1: Get total counts for both tables
  let logCountQuery = supabase.from("logs").select("id", { count: "exact", head: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activityCountQuery = (supabase as any).from("activity_feed").select("id", { count: "exact", head: true });

  if (filterByUserId) {
    logCountQuery = logCountQuery.eq("user_id", filterByUserId);
    activityCountQuery = activityCountQuery.eq("user_id", filterByUserId) as typeof activityCountQuery;
  }

  const [logCountResult, activityCountResult] = await Promise.all([
    logCountQuery,
    activityCountQuery,
  ]);

  const totalLogCount = logCountResult.count || 0;
  const totalActivityCount = activityCountResult.count || 0;
  const totalCount = totalLogCount + totalActivityCount;

  // Step 2: Determine the range for this page
  const from = (currentPage - 1) * logsPerPage;
  const to = from + logsPerPage - 1;

  // Step 3: Fetch logs and activities with enough range to cover the page
  // We fetch from both tables ordered by created_at DESC and take enough items
  // to fill the page. Since we need to merge, we fetch `logsPerPage` from each.
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activitiesQuery = (supabase as any)
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

  // For efficient pagination, we use a cursor-like approach:
  // Fetch `to + 1` items from each source ordered by created_at DESC,
  // merge, sort, and take the slice [from, to].
  const fetchLimit = to + 1; // enough to cover any page

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
  const pageItems = allItems.slice(from, to + 1);

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
    totalCount,
    mentionedProfiles,
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
    .filter(a => a.activity_type === "SHOWCASE_CREATED" && a.target_id)
    .map(a => a.target_id as string);
  
  const insightIds = activities
    .filter(a => a.activity_type === "INSIGHT_CREATED" && a.target_id)
    .map(a => a.target_id as string);
  
  const meetupIds = activities
    .filter(a => a.activity_type === "MEETUP_CREATED" && a.target_id)
    .map(a => a.target_id as string);

  const [showcases, insights, meetups] = await Promise.all([
    showcaseIds.length > 0
      ? supabase.from("showcases").select("id, name, short_description, thumbnail_url").in("id", showcaseIds)
      : Promise.resolve({ data: [] }),
    insightIds.length > 0
      ? supabase.from("insights").select("id, title, summary, image_url, content").in("id", insightIds)
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
    if (activity.activity_type === "SHOWCASE_CREATED") {
      const detail = showcases.data?.find(s => s.id === activity.target_id);
      if (detail) {
        activity.details = {
          showcase: {
            title: detail.name,
            short_description: detail.short_description,
            thumbnail_url: detail.thumbnail_url,
          }
        };
      }
    } else if (activity.activity_type === "INSIGHT_CREATED") {
      const detail = insights.data?.find(i => i.id === activity.target_id);
      if (detail) {
        const { getPlainTextFromTiptapJson } = require("@/lib/utils");
        activity.details = {
          insight: {
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
