"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBio(profileId: string, bioContent: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== profileId) {
    return { error: { message: "Unauthorized" } };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ bio: bioContent, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) {
    console.error("Error updating bio:", error);
    return { error };
  }

  revalidatePath(`/profile/${user.user_metadata.username}`);
  revalidatePath(`/profile`);

  return { error: null };
}
