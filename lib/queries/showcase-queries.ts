import { Database } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

type ShowcaseRow = Database["public"]["Tables"]["showcases"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface ShowcaseMember {
  id: string;
  user_id: string;
  display_order: number;
  profile: ProfileRow | null; // Joined profile data
}

// Redeclare common properties to ensure availability
export interface OptimizedShowcase extends ShowcaseRow {
  name: string;
  short_description: string;
  description: string | null;
  thumbnail_url: string | null;
  user_id: string;
  profiles: ProfileRow | null;
  showcase_upvotes: Array<{ user_id: string }>;
  showcase_comments: Array<{ id: string }>;
  upvotesCount: number;
  hasUpvoted: boolean;
  members: ShowcaseMember[]; // Added members array
  images: string[];
  web_url: string | null;
  playstore_url: string | null;
  appstore_url: string | null;
  slug: string | null;
  showcase_awards: Array<{ date: string; type: string }>;
}

export interface ShowcaseQueryOptions {
  currentUserId: string | null;
  currentPage: number;
  showcasesPerPage: number;
  filterByUserId?: string;
  filterByParticipantUserId?: string;
  filterByCommentedUserId?: string;
  filterByUpvotedUserId?: string;
  searchQuery?: string;
}

export interface ShowcaseQueryResult {
  showcases: OptimizedShowcase[];
  count: number;
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  currentPage: number;
}

/**
 * Add an upvote to a showcase
 */
export async function insertShowcaseUpvote(
  supabase: SupabaseClient<Database>,
  showcaseId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("showcase_upvotes")
    .insert({ showcase_id: showcaseId, user_id: userId });

  if (error) throw error;
}

/**
 * Remove an upvote from a showcase
 */
export async function deleteShowcaseUpvote(
  supabase: SupabaseClient<Database>,
  showcaseId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("showcase_upvotes")
    .delete()
    .eq("showcase_id", showcaseId)
    .eq("user_id", userId);

  if (error) throw error;
}

export interface ShowcaseListResult {
  showcases: any[];
  count: number;
}

/**
 * Fetch showcase search list with query and pagination
 */
export async function getShowcasesSearchList(
  supabase: SupabaseClient<Database>,
  searchQuery: string,
  currentPage: number,
  itemsPerPage: number
): Promise<ShowcaseListResult> {
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  let query = supabase
    .from('showcases')
    .select(`
      *,
      views_count,
      profiles(*),
      showcase_upvotes(user_id),
      showcase_comments(id)
    `, { count: 'exact' });

  if (searchQuery) {
    const escaped = searchQuery.replace(/"/g, '\\"');
    query = query.or(`name.ilike."%${escaped}%",short_description.ilike."%${escaped}%"`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    showcases: data || [],
    count: count || 0,
  };
}

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export async function getShowcaseDetail(
  supabase: SupabaseClient<Database>,
  showcaseIdOrSlug: string
) {
  let query = supabase
    .from("showcases")
    .select(`
      id,
      name,
      slug,
      short_description,
      description,
      thumbnail_url,
      images,
      created_at,
      updated_at,
      user_id,
      views_count,
      web_url,
      playstore_url,
      appstore_url,
      showcase_awards(date, type),
      profiles:user_id (id, username, full_name, avatar_url, updated_at, tagline, bio, link, certified),
      showcase_comments(id),
      upvotes_count:showcase_upvotes(count),
      showcase_upvotes(user_id),
      members:showcases_members(
        id,
        user_id,
        display_order,
        profile:profiles!showcases_members_user_id_fkey(id, username, full_name, avatar_url, tagline)
      )
    `);

  if (isUUID(showcaseIdOrSlug)) {
    query = query.eq("id", showcaseIdOrSlug);
  } else {
    query = query.eq("slug", showcaseIdOrSlug);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function getShowcaseIdBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("showcases")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

export const getShowcaseIdBySlugCached = (
  supabase: SupabaseClient<Database>,
  slug: string
) => {
  return unstable_cache(
    async () => {
      return getShowcaseIdBySlug(supabase, slug);
    },
    ["showcase-id-by-slug", slug],
    {
      revalidate: 3600,
      tags: ["showcase-all", `showcase-slug-${slug}`],
    }
  )();
};

export const getShowcaseDetailCached = async (
  supabase: SupabaseClient<Database>,
  showcaseIdOrSlug: string
) => {
  let actualId = showcaseIdOrSlug;
  if (!isUUID(showcaseIdOrSlug)) {
    const resolvedId = await getShowcaseIdBySlugCached(supabase, showcaseIdOrSlug);
    if (!resolvedId) return null;
    actualId = resolvedId;
  }

  return unstable_cache(
    async () => {
      return getShowcaseDetail(supabase, actualId);
    },
    ["showcase-detail-by-id", actualId],
    {
      revalidate: 3600,
      tags: ["showcase-all", `showcase-${actualId}`, `showcase-${showcaseIdOrSlug}`],
    }
  )();
};
