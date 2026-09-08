"use server";

import { createClient } from "@/lib/supabase/server";
import type { ShowcaseStatus } from "@/lib/constants";

export interface TrendingShowcase {
  id: string;
  name: string;
  slug: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  status: ShowcaseStatus | null;
  score: number;
  upvotes_count: number;
  views_count: number;
}

export async function getTrendingShowcases(): Promise<TrendingShowcase[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_trending_showcases");

  if (error) {
    console.error("Error fetching trending showcases:", error);
    return [];
  }

  const rows = (data as Omit<TrendingShowcase, "status">[]) || [];
  if (rows.length === 0) return [];

  // get_trending_showcases RPC 는 status 를 반환하지 않는다. RPC 를 고치는 대신
  // 최대 10건의 id 로 진행 상태만 따로 읽어서 채운다.
  const { data: statusRows, error: statusError } = await supabase
    .from("showcases")
    .select("id, status")
    .in(
      "id",
      rows.map((row) => row.id),
    );

  if (statusError) {
    console.error("Error fetching trending showcase statuses:", statusError);
    return rows.map((row) => ({ ...row, status: null }));
  }

  const statusById = new Map(statusRows.map((row) => [row.id, row.status]));

  return rows.map((row) => ({
    ...row,
    status: statusById.get(row.id) ?? null,
  }));
}
