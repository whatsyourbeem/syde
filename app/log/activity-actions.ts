"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/error-handler";
import { createSuccessResponse } from "@/lib/types/api";

/**
 * Delete an activity from the activity_feed
 */
export const deleteActivity = withAuth(async ({ supabase, user }, activityId: string) => {
  // 1. Check if the activity exists and belongs to the user
  const { data: activity, error: fetchError } = await supabase
    .from("activity_feed")
    .select("id, user_id")
    .eq("id", activityId)
    .single();

  if (fetchError || !activity) {
    throw new Error("Activity not found.");
  }

  if (activity.user_id !== user.id) {
    throw new Error("Unauthorized: You can only delete your own activities.");
  }

  // 2. Delete the activity
  const { data: deletedData, error: deleteError } = await supabase
    .from("activity_feed")
    .delete()
    .eq("id", activityId)
    .select();

  if (deleteError) {
    throw new Error(`Failed to delete activity: ${deleteError.message}`);
  }

  if (!deletedData || deletedData.length === 0) {
    throw new Error("Deletion failed: The record was found but could not be removed. This is often due to missing RLS permissions.");
  }

  // 3. Revalidate paths
  revalidatePath("/");
  if (user?.user_metadata?.username) {
    revalidatePath(`/${user.user_metadata.username}`);
  }

  return createSuccessResponse(null);
});
