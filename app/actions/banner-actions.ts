"use server";

import { createStaticClient } from "@/lib/supabase/static";
import { BANNER_POSITIONS, type BannerPosition } from "@/lib/constants";

export interface Banner {
  id: string;
  created_at: string | null;
  name: string;
  image_url: string;
  link_url: string;
  is_active: boolean | null;
  position: string;
  display_order: number | null;
  starts_at: string | null;
  ends_at: string | null;
}

export async function getActiveBanners(position?: BannerPosition): Promise<Banner[]> {
  // Cookie-free client: this is rendered inside app/blog|showcase/layout.tsx as a
  // prop passed into a client component, so it runs on every page under those
  // layouts (including cacheable detail pages) regardless of whether it's
  // actually displayed there. `banners` SELECT RLS is public (USING (true)).
  const supabase = createStaticClient();

  let query = supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (position) {
    query = query.eq("position", position);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching banners:", error);
    return [];
  }

  // Client-side (in server action) filtering for scheduling
  return (data || []).filter((banner: any) => {
    const startsAt = banner.starts_at;
    const endsAt = banner.ends_at;

    if (startsAt && new Date(startsAt) > new Date()) return false;
    if (endsAt && new Date(endsAt) < new Date()) return false;

    return true;
  });
}
