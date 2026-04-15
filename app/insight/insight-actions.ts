"use server";

import { revalidatePath } from "next/cache";
import { processMentionsForSave } from "@/lib/utils";
import { createSuccessResponse } from "@/lib/types/api";
import { withAuth, validateRequired } from "@/lib/error-handler";

export const createComment = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string, "댓글");
    const insightId = validateRequired(formData.get("insight_id") as string, "인사이트 ID");
    const parentCommentId = formData.get("parent_comment_id") as string | null;

    const processedContent = await processMentionsForSave(content, supabase);

    const { error } = await supabase.from("insight_comments").insert({
      content: processedContent,
      insight_id: insightId,
      user_id: user.id,
      parent_comment_id: parentCommentId,
    });

    if (error) {
      console.error("Error creating comment:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/insight/${insightId}`);
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
    const insightId = validateRequired(formData.get("insight_id") as string, "인사이트 ID");

    const processedContent = await processMentionsForSave(content, supabase);

    const { error } = await supabase
      .from("insight_comments")
      .update({ content: processedContent })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating comment:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/insight/${insightId}`);
    return createSuccessResponse(null);
  }
);

export const deleteComment = withAuth(
  async ({ supabase, user }, commentId: string, insightId: string) => {
    const { error } = await supabase
      .from("insight_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting comment:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/insight/${insightId}`);
    return createSuccessResponse(null);
  }
);

export const toggleCommentLike = withAuth(
  async ({ supabase, user }, commentId: string, insightId: string, hasLiked: boolean) => {
    if (hasLiked) {
      const { error } = await supabase
        .from("insight_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
      if (error) throw new Error(`좋아요 취소 실패: ${error.message}`);
    } else {
      const { error } = await supabase
        .from("insight_likes")
        .insert({ comment_id: commentId, user_id: user.id });
      if (error) throw new Error(`좋아요 실패: ${error.message}`);
    }

    revalidatePath(`/insight/${insightId}`);
    return createSuccessResponse(null);
  }
);
