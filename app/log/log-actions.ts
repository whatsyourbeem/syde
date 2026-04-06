"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { processMentionsForSave } from "@/lib/utils";
import { createSuccessResponse } from "@/lib/types/api";
import { withAuth, withAuthForm, validateRequired } from "@/lib/error-handler";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { deleteLogStorage, deleteFile } from "@/lib/storage";

export const createLog = withAuthForm(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string, "내용");
    // 이미지는 클라이언트에서 업로드 완료 후 URL로 전달됨
    const imageUrl = formData.get("imageUrl") as string | null;

    const processedContent = await processMentionsForSave(content, supabase);

    const { data: log, error: createError } = await supabase
      .from("logs")
      .insert({ content: processedContent, user_id: user.id, image_url: imageUrl || null })
      .select("id")
      .single();

    if (createError) {
      return { error: `로그 생성 실패: ${createError.message}` };
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
    // 이미지는 클라이언트에서 업로드 완료 후 URL로 전달됨
    const newImageUrl = formData.get("imageUrl") as string | null;

    const { data: oldLogData } = await supabase
      .from("logs")
      .select("image_url, user_id")
      .eq("id", logId)
      .single();

    if (oldLogData?.user_id !== user.id) {
      return { error: "수정할 권한이 없습니다." };
    }

    // 기존 이미지가 변경/제거된 경우 admin client로 storage에서 삭제
    const oldImageUrl = oldLogData?.image_url;
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const path = oldImageUrl.split("/storage/v1/object/public/logs/")[1];
      if (path) await deleteFile(adminClient, "logs", path).catch(console.warn);
    }

    const processedContent = await processMentionsForSave(content, supabase);

    const { error } = await supabase
      .from("logs")
      .update({ content: processedContent, image_url: newImageUrl || null })
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

  // Delete storage in background (don't wait for completion)
  deleteLogStorage(logId).catch(err =>
    console.error("Storage deletion error:", err)
  );

  // Note: revalidatePath is not needed here because window.location.href
  // on the client side will do a full page reload, fetching fresh data

  return createSuccessResponse({ redirectTo: "/log" });
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
