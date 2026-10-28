import { unstable_cache } from "next/cache";
import { createStaticClient } from "@/lib/supabase/static";

export interface VisibleAnnouncement {
  content: string;
  link_url: string | null;
  icon: string | null;
}

async function fetchVisibleAnnouncement(): Promise<VisibleAnnouncement | null> {
  // Cookie-free client: the banner is rendered from the root layout, so reading cookies here
  // would force every page (including the cacheable ones) to render dynamically.
  // `announcements` SELECT RLS only exposes rows with is_visible = true to anyone.
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("announcements")
    .select("content, link_url, icon")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Throwing keeps unstable_cache from storing a failed lookup as "no announcement".
  if (error) throw error;
  return data;
}

const getCachedVisibleAnnouncement = unstable_cache(fetchVisibleAnnouncement, ["visible-announcement"], {
  // 1h, matching the TTL of getBlogPostDetailCached/getShowcaseDetailCached. Every page that renders the
  // banner inherits the shortest cache lifetime it reads, so a shorter value here would also make the
  // cacheable blog/showcase detail pages regenerate (and re-run their uncached queries) that often.
  // There is no admin UI that could call revalidateTag, so toggling is_visible in the dashboard shows up
  // after at most this long.
  revalidate: 3600,
  tags: ["announcements"],
});

/** The newest announcement whose is_visible is TRUE, or null when there is none (or the lookup failed). */
export async function getVisibleAnnouncement(): Promise<VisibleAnnouncement | null> {
  try {
    return await getCachedVisibleAnnouncement();
  } catch (error) {
    // The banner is a nicety; a failed lookup must not take the whole site down with it.
    console.error("Failed to load the announcement banner:", error);
    return null;
  }
}
