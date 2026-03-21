"use server";

import { createClient } from "@/lib/supabase/server";
import { BANNER_POSITIONS, type BannerPosition } from "@/lib/constants";

export interface Banner {
  id: string;
  created_at: string;
  name: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  position: string;
  display_order: number;
  starts_at: string | null;
  ends_at: string | null;
}

export async function getActiveBanners(position?: BannerPosition): Promise<Banner[]> {
  const supabase = await createClient();

  let query = supabase
    .from("banners" as any)
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (position) {
    query = query.eq("position", position);
  }

  // Filter by scheduling if needed
  const now = new Date().toISOString();
  // We can't easily do complex OR/AND with starts_at/ends_at in simple select, 
  // but we can filter after fetching or use raw query. 
  // For now, let's keep it simple and filter after if needed, 
  // or just rely on is_active for simplicity at first.

  const { data, error } = await (query as any);

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
