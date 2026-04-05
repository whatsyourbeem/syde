"use server";

import { createClient } from "@/lib/supabase/server";

export interface TrendingShowcase {
  id: string;
  name: string;
  slug: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  score: number;
  upvotes_count: number;
  views_count: number;
}

export async function getTrendingShowcases(): Promise<TrendingShowcase[]> {
  const supabase = await createClient();

  // Cast RPC name to any since database.types.ts might not be updated yet
  const { data, error } = await supabase.rpc("get_trending_showcases" as any);

  if (error) {
    console.error("Error fetching trending showcases:", error);
    return [];
  }

  return (data as unknown as TrendingShowcase[]) || [];
}
