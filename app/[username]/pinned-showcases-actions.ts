"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateTagSafe } from "@/lib/server-utils";

export interface UpdatePinnedShowcasesResult {
  success: boolean;
  error?: string;
}

export async function updatePinnedShowcases(
  showcaseIds: string[]
): Promise<UpdatePinnedShowcasesResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (showcaseIds.length > 3) {
    return { success: false, error: "대표 프로젝트는 최대 3개까지 고정할 수 있어요." };
  }

  const { error } = await supabase.rpc("set_pinned_showcases", {
    p_showcase_ids: showcaseIds,
  });

  if (error) {
    console.error("Error updating pinned showcases:", error);
    return { success: false, error: error.message };
  }

  revalidateTagSafe("profile-all");
  revalidateTagSafe(`profile-stats-${user.id}`);
  return { success: true };
}
