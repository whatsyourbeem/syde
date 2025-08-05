"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { processMentionsForSave } from "@/lib/utils";

export async function createLog(formData: FormData): Promise<{ error?: string; logId?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const content = formData.get("content") as string;
  const imageUrl = formData.get("imageUrl") as string | null;

  const processedContent = await processMentionsForSave(content, supabase);

  const { data: log, error } = await supabase
    .from("logs")
    .insert({
      content: processedContent,
      image_url: imageUrl,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating log:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  if (user.user_metadata.username) {
    revalidatePath(`/${user.user_metadata.username}`);
  }

  return { logId: log.id };
}

export async function updateLog(formData: FormData): Promise<{ error?: string; logId?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const logId = formData.get("logId") as string;
  const content = formData.get("content") as string;
  const imageUrl = formData.get("imageUrl") as string | null;

  const processedContent = await processMentionsForSave(content, supabase);

  const { error } = await supabase
    .from("logs")
    .update({
      content: processedContent,
      image_url: imageUrl,
    })
    .eq("id", logId)
    .eq("user_id", user.id); // Ensure only the owner can update

  if (error) {
    console.error("Error updating log:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  if (user.user_metadata.username) {
    revalidatePath(`/${user.user_metadata.username}`);
  }
  revalidatePath(`/log/${logId}`);

  return { logId: logId };
}

export async function createComment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const content = formData.get("content") as string;
  const logId = formData.get("log_id") as string;
  const parentCommentId = formData.get("parent_comment_id") as string | null;

  if (!content?.trim()) {
      return { error: "Comment cannot be empty." };
  }

  const processedContent = await processMentionsForSave(content, supabase);

  const { error } = await supabase.from("log_comments").insert({
    content: processedContent,
    log_id: logId,
    user_id: user.id,
    parent_comment_id: parentCommentId,
  });

  if (error) {
    console.error("Error creating comment:", error);
    return { error: error.message };
  }

  revalidatePath(`/log/${logId}`);
  return { success: true };
}

export async function updateComment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const content = formData.get("content") as string;
  const commentId = formData.get("comment_id") as string;
  const logId = formData.get("log_id") as string;

  if (!content?.trim()) {
    return { error: "Comment cannot be empty." };
  }

  const processedContent = await processMentionsForSave(content, supabase);

  const { error } = await supabase
    .from("log_comments")
    .update({ content: processedContent })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating comment:", error);
    return { error: error.message };
  }

  revalidatePath(`/log/${logId}`);
  return { success: true };
}
