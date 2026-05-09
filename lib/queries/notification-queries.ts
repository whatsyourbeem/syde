import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

/**
 * Fetch the unread notifications count for a given user ID
 */
export async function getUnreadNotificationsCount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread notifications count:", error);
    return 0;
  }

  return count ?? 0;
}
