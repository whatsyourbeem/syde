"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function joinClub(clubId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("club_members").insert({
    club_id: clubId,
    user_id: user.id,
    role: 'member', // default role
  });

  if (error) {
    console.error("Error joining club:", error);
    return { error: "클럽 가입 중 오류가 발생했습니다." };
  }

  revalidatePath(`/gathering/club/${clubId}`);
  return { success: true };
}

export async function leaveClub(clubId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("club_members")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error leaving club:", error);
    return { error: "클럽 탈퇴 중 오류가 발생했습니다." };
  }

  revalidatePath(`/gathering/club/${clubId}`);
  return { success: true };
}
