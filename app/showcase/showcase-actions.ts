"use server";

import { revalidatePath } from "next/cache";
import { processMentionsForSave } from "@/lib/utils";
import { createSuccessResponse } from "@/lib/types/api";
import { withAuth, withAuthForm, validateRequired } from "@/lib/error-handler";
import { handleShowcaseImage, deleteShowcaseStorage } from "@/lib/storage";

export const createShowcase = withAuthForm(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string, "내용");
    const imageFile = formData.get("imageFile") as File | null;

    const processedContent = await processMentionsForSave(content, supabase);

    const { data, error: insertError } = await supabase
      .from("showcases")
      .insert({
        content: processedContent,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create showcase:", insertError);
      return { error: "쇼케이스 생성에 실패했습니다." };
    }

    const showcaseId = data.id;

    const imageUrl = await handleShowcaseImage(showcaseId, imageFile, false, null);

    if (imageUrl) {
      const { error: updateError } = await supabase
        .from("showcases")
        .update({ image_url: imageUrl })
        .eq("id", showcaseId);

      if (updateError) {
        console.error("Failed to update showcase with image:", updateError);
        // Optionally, you might want to delete the showcase record here
        // or handle the dangling image file. For now, we'll return an error.
        return { error: "쇼케이스 이미지 정보 업데이트에 실패했습니다." };
      }
    }

    revalidatePath("/");
    revalidatePath("/showcase");
    if (user?.user_metadata?.username) {
      revalidatePath(`/${user.user_metadata.username}`);
    }
    revalidatePath(`/showcase/${showcaseId}`);

    return { id: showcaseId };
  }
);

export const updateShowcase = withAuthForm(
  async ({ supabase, user }, formData: FormData) => {
    const showcaseId = validateRequired(formData.get("showcaseId") as string, "쇼케이스 ID");
    const content = validateRequired(formData.get("content") as string, "내용");
    const imageFile = formData.get("imageFile") as File | null;
    const imageRemoved = formData.get("imageRemoved") === "true";

    const { data: oldShowcaseData } = await supabase
      .from("showcases")
      .select("image_url, user_id")
      .eq("id", showcaseId)
      .single();

    if (oldShowcaseData?.user_id !== user.id) {
      return { error: "수정할 권한이 없습니다." };
    }

    const imageUrl = await handleShowcaseImage(
      showcaseId,
      imageFile,
      imageRemoved,
      oldShowcaseData?.image_url
    );
    const processedContent = await processMentionsForSave(content, supabase);

    const updateData: { content: string; image_url?: string | null } = {
      content: processedContent,
    };
    if (imageUrl !== undefined) {
      updateData.image_url = imageUrl;
    }

    const { error } = await supabase
      .from("showcases")
      .update(updateData)
      .eq("id", showcaseId);

    if (error) {
      return { error: `쇼케이스 업데이트 실패: ${error.message}` };
    }

    revalidatePath("/");
    if (user?.user_metadata?.username) {
      revalidatePath(`/${user.user_metadata.username}`);
    }
    revalidatePath(`/showcase/${showcaseId}`);

    return { id: showcaseId };
  }
);

export const createComment = withAuth(
  async ({ supabase, user }, formData: FormData) => {
    const content = validateRequired(formData.get("content") as string, "댓글");
    const showcaseId = validateRequired(formData.get("showcase_id") as string, "쇼케이스 ID");
    const parentCommentId = formData.get("parent_comment_id") as string | null;

    const processedContent = await processMentionsForSave(content, supabase);

    const { error } = await supabase.from("showcase_comments").insert({
      content: processedContent,
      showcase_id: showcaseId,
      user_id: user.id,
      parent_comment_id: parentCommentId,
    });

    if (error) {
      console.error("Error creating comment:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/showcase/${showcaseId}`);
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
    const showcaseId = validateRequired(formData.get("showcase_id") as string, "쇼케이스 ID");

    const processedContent = await processMentionsForSave(content, supabase);

    const { error } = await supabase
      .from("showcase_comments")
      .update({ content: processedContent })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating comment:", error);
      throw new Error(error.message);
    }

    revalidatePath(`/showcase/${showcaseId}`);
    return createSuccessResponse(null);
  }
);

export const deleteShowcase = withAuth(async ({ supabase, user }, showcaseId: string) => {
  const { data: showcase, error: fetchError } = await supabase
    .from("showcases")
    .select("id, user_id")
    .eq("id", showcaseId)
    .single();

  if (fetchError || !showcase) {
    throw new Error("Showcase not found.");
  }

  if (showcase.user_id !== user.id) {
    throw new Error("Unauthorized.");
  }

  const { error: deleteShowcaseError } = await supabase
    .from("showcases")
    .delete()
    .eq("id", showcaseId);

  if (deleteShowcaseError) {
    throw new Error(deleteShowcaseError.message);
  }

  await deleteShowcaseStorage(showcaseId);

  revalidatePath("/");
  revalidatePath("/showcase");
  if (user.user_metadata.username) {
    revalidatePath(`/${user.user_metadata.username}`);
  }

  return createSuccessResponse(null);
});

export const toggleShowcaseBookmark = withAuth(
  async ({ supabase, user }, showcaseId: string, hasBookmarked: boolean) => {
    if (hasBookmarked) {
      const { error } = await supabase
        .from("showcase_bookmarks")
        .delete()
        .eq("showcase_id", showcaseId)
        .eq("user_id", user.id);
      if (error) throw new Error(`북마크 취소 실패: ${error.message}`);
    } else {
      const { error } = await supabase
        .from("showcase_bookmarks")
        .insert({ showcase_id: showcaseId, user_id: user.id });
      if (error) throw new Error(`북마크 추가 실패: ${error.message}`);
    }

    revalidatePath("/");
    revalidatePath(`/showcase/${showcaseId}`);
    if (user?.user_metadata?.username) {
      revalidatePath(`/${user.user_metadata.username}`);
    }

    return createSuccessResponse(null);
  }
);
