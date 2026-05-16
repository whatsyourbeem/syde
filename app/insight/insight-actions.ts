"use server";

import { revalidatePath } from "next/cache";
import { processMentionsForSave } from "@/lib/utils";
import { createSuccessResponse } from "@/lib/types/api";
import { withAuth, validateRequired } from "@/lib/error-handler";
import { revalidateTagSafe } from "@/lib/server-utils";

export const createInsight = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const title = validateRequired(formData.get("title") as string | null, "제목");
    const summary = formData.get("summary") as string | null;
    const content = formData.get("content") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    // slug는 DB 트리거(trig_handle_insight_slug)가 title 기반으로 자동 생성
    const { data, error } = await supabase
      .from("insights")
      .insert({
        user_id: user.id,
        title,
        summary,
        content: content ? JSON.parse(content) : null,
        image_url: imageUrl || null,
      })
      .select("id, slug")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/insight");
    revalidateTagSafe("insight-all");
    return createSuccessResponse({ id: data.id, slug: data.slug });
  }
);

export const updateInsight = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const id = validateRequired(formData.get("id") as string | null, "인사이트 ID");
    const title = validateRequired(formData.get("title") as string | null, "제목");
    const summary = formData.get("summary") as string | null;
    const content = formData.get("content") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    const { error } = await supabase
      .from("insights")
      .update({
        title,
        summary,
        content: content ? JSON.parse(content) : null,
        image_url: imageUrl || null,
        // slug은 최초 생성 후 변경하지 않음 (외부 공유 URL 보호)
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);

    revalidatePath("/insight");
    revalidatePath(`/insight/${id}`);
    revalidateTagSafe("insight-all");
    revalidateTagSafe(`insight-${id}`);
    return createSuccessResponse({ id });
  }
);

export const createComment = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string | null, "댓글");
    const insightId = validateRequired(formData.get("insight_id") as string | null, "인사이트 ID");
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
    revalidateTagSafe("insight-all");
    revalidateTagSafe(`insight-${insightId}`);
    return createSuccessResponse(null);
  }
);

export const updateComment = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string | null, "댓글");
    const commentId = validateRequired(
      formData.get("comment_id") as string,
      "댓글 ID"
    );
    const insightId = validateRequired(formData.get("insight_id") as string | null, "인사이트 ID");

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
    revalidateTagSafe("insight-all");
    revalidateTagSafe(`insight-${insightId}`);
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
    revalidateTagSafe("insight-all");
    revalidateTagSafe(`insight-${insightId}`);
    return createSuccessResponse(null);
  }
);

export const toggleCommentLike = withAuth(
  async ({ supabase, user }, commentId: string, insightId: string, hasLiked: boolean) => {
    if (hasLiked) {
      const { error } = await supabase
        .from("insight_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
      if (error) throw new Error(`좋아요 취소 실패: ${error.message}`);
    } else {
      const { error } = await supabase
        .from("insight_comment_likes")
        .insert({ comment_id: commentId, user_id: user.id });
      if (error) throw new Error(`좋아요 실패: ${error.message}`);
    }

    revalidatePath(`/insight/${insightId}`);
    revalidateTagSafe("insight-all");
    revalidateTagSafe(`insight-${insightId}`);
    return createSuccessResponse(null);
  }
);

export const toggleInsightLike = withAuth(
  async ({ supabase, user }, insightId: string, currentlyLiked: boolean) => {
    if (currentlyLiked) {
      const { error } = await supabase
        .from("insight_likes")
        .delete()
        .eq("insight_id", insightId)
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("insight_likes")
        .insert({ insight_id: insightId, user_id: user.id });
      if (error) throw new Error(error.message);
    }

    revalidateTagSafe("insight-all");
    revalidateTagSafe(`insight-${insightId}`);
    return createSuccessResponse(null);
  }
);

export const toggleInsightBookmark = withAuth(
  async ({ supabase, user }, insightId: string, currentlyBookmarked: boolean) => {
    if (currentlyBookmarked) {
      const { error } = await supabase
        .from("insight_bookmarks")
        .delete()
        .eq("insight_id", insightId)
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("insight_bookmarks")
        .insert({ insight_id: insightId, user_id: user.id });
      if (error) throw new Error(error.message);
    }

    revalidateTagSafe("insight-all");
    revalidateTagSafe(`insight-${insightId}`);
    return createSuccessResponse(null);
  }
);

export async function revalidateInsightAction(insightId: string) {
  revalidatePath("/insight");
  revalidateTagSafe("insight-all");
  revalidateTagSafe(`insight-${insightId}`);
}
