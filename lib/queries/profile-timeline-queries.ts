import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

type ShowcaseStatus = Database["public"]["Enums"]["showcase_status_enum"];

export interface ProfileTimelineShowcaseItem {
  type: "showcase";
  date: string;
  id: string;
  name: string | null;
  slug: string | null;
  status: ShowcaseStatus;
  thumbnailUrl: string | null;
}

export interface ProfileTimelineBlogItem {
  type: "blog";
  date: string;
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  imageUrl: string | null;
}

export type ProfileTimelineItem = ProfileTimelineShowcaseItem | ProfileTimelineBlogItem;

/**
 * 쇼케이스(런칭/진행중/접음)와 블로그 글을 시간순으로 병합한 "만들어온 여정" 타임라인.
 * 각 소스에서 동일한 limit만큼 가져와 병합 후 상위 limit개만 자른다 — 두 소스 모두
 * limit개 이상 가져오는 한 전역 상위 limit개는 항상 정확하므로, 병합용 UNION RPC가 필요 없다.
 * ENDED 쇼케이스는 updated_at을 종료 시점으로 근사해 정렬 기준으로 쓴다.
 */
export async function getProfileTimeline(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number
): Promise<{ items: ProfileTimelineItem[]; hasMore: boolean }> {
  const [showcasesResult, blogPostsResult] = await Promise.all([
    supabase
      .from("showcases")
      .select("id, name, slug, status, thumbnail_url, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("blog_posts")
      .select("id, title, slug, summary, image_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (showcasesResult.error) {
    console.error("Error fetching timeline showcases:", showcasesResult.error);
  }
  if (blogPostsResult.error) {
    console.error("Error fetching timeline blog posts:", blogPostsResult.error);
  }

  const showcaseItems: ProfileTimelineItem[] = (showcasesResult.data || []).map((s) => ({
    type: "showcase",
    date: s.status === "ENDED" ? s.updated_at ?? s.created_at ?? "" : s.created_at ?? "",
    id: s.id,
    name: s.name,
    slug: s.slug,
    status: s.status,
    thumbnailUrl: s.thumbnail_url,
  }));

  const blogItems: ProfileTimelineItem[] = (blogPostsResult.data || []).map((b) => ({
    type: "blog",
    date: b.created_at,
    id: b.id,
    title: b.title,
    slug: b.slug,
    summary: b.summary,
    imageUrl: b.image_url,
  }));

  const merged = [...showcaseItems, ...blogItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const hasMore =
    (showcasesResult.data?.length || 0) >= limit || (blogPostsResult.data?.length || 0) >= limit;

  return { items: merged.slice(0, limit), hasMore };
}
