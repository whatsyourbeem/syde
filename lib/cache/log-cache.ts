import { createClient } from "@/lib/supabase/server";
import { getOptimizedLogs, LogQueryOptions, LogQueryResult } from "@/lib/queries/log-queries";

// Remove caching for now to avoid cookies issue in cached functions
export async function getCachedLogs(options: LogQueryOptions): Promise<LogQueryResult> {
  return await getOptimizedLogs(options);
}

export async function getCachedProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, updated_at")
    .eq("id", userId)
    .single();
  
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching cached profile:", error);
    return null;
  }
  
  return data;
}