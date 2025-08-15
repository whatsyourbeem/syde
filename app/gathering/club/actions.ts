"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Json } from "@/types/database.types";

export async function joinClub(clubId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("club_members").insert({
    club_id: clubId,
    user_id: user.id,
    // TODO: Make role dynamic based on club settings
    role: "GENERAL_MEMBER",
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

export async function createClubPost(
  forumId: string,
  title: string,
  content: Json
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (!title.trim()) {
    return { error: "제목을 입력해주세요." };
  }

  if (!content) {
    return { error: "내용을 입력해주세요." };
  }

  const { data: post, error } = await supabase
    .from("club_forum_posts")
    .insert({
      forum_id: forumId,
      user_id: user.id,
      title: title,
      content: content,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating post:", error);
    return { error: "게시글 작성 중 오류가 발생했습니다." };
  }

  // Find the club_id from the forum to revalidate the path
  const { data: forum } = await supabase
    .from("club_forums")
    .select("club_id")
    .eq("id", forumId)
    .single();

  if (forum?.club_id) {
    revalidatePath(`/gathering/club/${forum.club_id}`);
  }

  return { success: true, post };
}
