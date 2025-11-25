"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { processMentionsForSave } from "@/lib/utils";
import { createSuccessResponse } from "@/lib/types/api";
import { withAuth, withAuthForm, validateRequired } from "@/lib/error-handler";
import { handleLogImage, deleteLogStorage } from "@/lib/storage";

export const createLog = withAuthForm(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string, "내용");
    const imageFile = formData.get("imageFile") as File | null;

    const processedContent = await processMentionsForSave(content, supabase);

    const { data: log, error: createError } = await supabase
      .from("logs")
      .insert({ content: processedContent, user_id: user.id })
      .select("id")
      .single();

    if (createError) {
      return { error: `로그 생성 실패: ${createError.message}` };
    }

    const imageUrl = await handleLogImage(log.id, imageFile, false);

    if (imageUrl) {
      const { error: updateError } = await supabase
        .from("logs")
        .update({ image_url: imageUrl })
        .eq("id", log.id);

      if (updateError) {
        await deleteLogStorage(log.id);
        return { error: `로그 업데이트 실패: ${updateError.message}` };
      }
    }

    revalidatePath("/");
    if (user?.user_metadata?.username) {
      revalidatePath(`/${user.user_metadata.username}`);
    }

    return { id: log.id };
  }
);

export const updateLog = withAuthForm(
  async ({ supabase, user }, formData: FormData) => {
    const logId = validateRequired(formData.get("logId") as string, "로그 ID");
    const content = validateRequired(formData.get("content") as string, "내용");
    const imageFile = formData.get("imageFile") as File | null;
    const imageRemoved = formData.get("imageRemoved") === "true";

    const { data: oldLogData } = await supabase
      .from("logs")
      .select("image_url, user_id")
      .eq("id", logId)
      .single();

    if (oldLogData?.user_id !== user.id) {
      return { error: "수정할 권한이 없습니다." };
    }

    const imageUrl = await handleLogImage(
      logId,
      imageFile,
      imageRemoved,
      oldLogData?.image_url
    );
    const processedContent = await processMentionsForSave(content, supabase);

    const updateData: { content: string; image_url?: string | null } = {
      content: processedContent,
    };
    if (imageUrl !== undefined) {
      updateData.image_url = imageUrl;
    }

    const { error } = await supabase
      .from("logs")
      .update(updateData)
      .eq("id", logId);

    if (error) {
      return { error: `로그 업데이트 실패: ${error.message}` };
    }

    revalidatePath("/");
    if (user?.user_metadata?.username) {
      revalidatePath(`/${user.user_metadata.username}`);
    }
    revalidatePath(`/log/${logId}`);

    return { id: logId };
  }
);

export const createComment = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string, "댓글");
    const logId = validateRequired(formData.get("log_id") as string, "로그 ID");
    const parentCommentId = formData.get("parent_comment_id") as string | null;

    const processedContent = await processMentionsForSave(content, supabase);

    const { error } = await supabase.from("log_comments").insert({
      content: processedContent,
      log_id: logId,
      user_id: user.id,
      parent_comment_id: parentCommentId,
    });

    if (error) {
      console.error("Error creating comment:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/log/${logId}`);
    return createSuccessResponse(null);
  }
);

export const updateComment = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string, "댓글");
    const commentId = validateRequired(
      formData.get("comment_id") as string,
      "댓글 ID"
    );
    const logId = validateRequired(formData.get("log_id") as string, "로그 ID");

    const processedContent = await processMentionsForSave(content, supabase);

    const { error } = await supabase
      .from("log_comments")
      .update({ content: processedContent })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating comment:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/log/${logId}`);
    return createSuccessResponse(null);
  }
);

export const deleteLog = withAuth(async ({ supabase, user }, logId: string) => {
  const { data: log, error: fetchError } = await supabase
    .from("logs")
    .select("id, user_id")
    .eq("id", logId)
    .single();

  if (fetchError || !log) {
    throw new Error("Log not found.");
  }

  if (log.user_id !== user.id) {
    throw new Error("Unauthorized.");
  }

  const { error: deleteLogError } = await supabase
    .from("logs")
    .delete()
    .eq("id", logId);

  if (deleteLogError) {
    throw new Error(deleteLogError.message);
  }

  await deleteLogStorage(logId); // Re-enabled storage deletion

  revalidatePath("/");
  revalidatePath("/log");
  if (user.user_metadata.username) {
    revalidatePath(`/${user.user_metadata.username}`);
  }

  return createSuccessResponse(null);
});

export const toggleLogBookmark = withAuth(
  async ({ supabase, user }, logId: string, hasBookmarked: boolean) => {
    if (hasBookmarked) {
      const { error } = await supabase
        .from("log_bookmarks")
        .delete()
        .eq("log_id", logId)
        .eq("user_id", user.id);
      if (error) throw new Error(`북마크 취소 실패: ${error.message}`);
    } else {
      const { error } = await supabase
        .from("log_bookmarks")
        .insert({ log_id: logId, user_id: user.id });
      if (error) throw new Error(`북마크 추가 실패: ${error.message}`);
    }

    revalidatePath("/");
    revalidatePath(`/log/${logId}`);
    if (user?.user_metadata?.username) {
      revalidatePath(`/${user.user_metadata.username}`);
    }

    return createSuccessResponse(null);
  }
);
