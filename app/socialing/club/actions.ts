"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/database.types";

export async function updateClubMemberRole(
  clubId: string,
  userId: string,
  role: Database["public"]["Enums"]["club_member_role_enum"]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("owner_id")
    .eq("id", clubId)
    .single();

  if (clubError || !club) {
    return { error: "Club not found" };
  }

  if (club.owner_id !== user.id) {
    return { error: "Only the club owner can change member roles." };
  }

  // The owner's role cannot be changed.
  if (userId === club.owner_id) {
    return { error: "Cannot change the role of the club owner." };
  }

  const { data, error } = await supabase
    .from("club_members")
    .update({ role })
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .select();

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      error:
        "Failed to update member role. This may be a permissions issue (RLS).",
    };
  }

  revalidatePath(`/socialing/club/${clubId}`);

  return { success: true };
}
