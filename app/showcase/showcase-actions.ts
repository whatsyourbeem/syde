"use server";

import { revalidatePath } from "next/cache";
import { processMentionsForSave } from "@/lib/utils";
import { createSuccessResponse } from "@/lib/types/api";
import { withAuth, withAuthForm, validateRequired } from "@/lib/error-handler";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { deleteShowcaseStorage, deleteFile } from "@/lib/storage";
import { generateSlug } from "@/lib/utils";

export const createShowcase = withAuthForm(
  async ({ supabase, user }, formData: FormData) => {
    const name = formData.get("name") as string;
    const shortDescription = validateRequired(formData.get("shortDescription") as string, "한 줄 소개");
    const descriptionString = formData.get("description") as string;
    // 이미지는 클라이언트에서 업로드 완료 후 URL로 전달됨
    const thumbnailUrl = formData.get("thumbnailUrl") as string | null;
    const detailImageUrls = formData.getAll("detailImageUrls") as string[];
    const websiteLinks = formData.getAll("links_website") as string[];
    const googlePlayLink = formData.get("links_google_play") as string | null;
    const appStoreLink = formData.get("links_app_store") as string | null;

    let processedDescription: any = descriptionString;
    
    try {
      // If it's valid JSON, we parse it to an object for jsonb column
      processedDescription = JSON.parse(descriptionString);
    } catch (e) {
      // If not JSON, it's legacy text/HTML, process mentions and store as string
      processedDescription = descriptionString ? await processMentionsForSave(descriptionString, supabase) : null;
    }

    // Generate unique slug
    let slug = generateSlug(name);
    if (!slug) slug = "project";
    
    // Check for existing slug to ensure uniqueness
    const { data: existingSlug } = await supabase
      .from("showcases")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const { data, error: insertError } = await supabase
      .from("showcases")
      .insert({
        name,
        slug,
        short_description: shortDescription,
        description: processedDescription,
        user_id: user.id,
        web_url: websiteLinks[0] || null, // Assuming first link is taken if multiple are mistakenly passed
        playstore_url: googlePlayLink || null,
        appstore_url: appStoreLink || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create showcase:", insertError);
      return { error: `쇼케이스 생성 실패: ${insertError.message} (Code: ${insertError.code})` };
    }

    const showcaseId = data.id;

    // 이미지 URL을 DB에 직접 저장 (업로드는 클라이언트에서 완료됨)
    const { error: imageUpdateError } = await supabase
      .from("showcases")
      .update({
        thumbnail_url: thumbnailUrl || null,
        images: detailImageUrls.length > 0 ? detailImageUrls : null,
      })
      .eq("id", showcaseId);

    if (imageUpdateError) {
      console.error("Failed to update showcase images:", imageUpdateError);
      return { error: "이미지 정보 저장에 실패했습니다." };
    }


    // Insert Team Members
    const teamMembersJson = formData.get("teamMembers") as string | null;
    if (teamMembersJson) {
      try {
        const teamMemberIds = JSON.parse(teamMembersJson) as string[];
        if (teamMemberIds.length > 0) {
          const membersToInsert = teamMemberIds.map((userId, index) => ({
            showcase_id: showcaseId,
            user_id: userId,
            display_order: index,
          }));

          const { error: membersError } = await supabase
            .from("showcases_members")
            .insert(membersToInsert);

          if (membersError) {
            console.error("Failed to insert showcase members:", membersError);
          }
        }
      } catch (e) {
        console.error("Error parsing team members JSON:", e);
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
    const name = formData.get("name") as string;
    const shortDescription = validateRequired(formData.get("shortDescription") as string, "한 줄 소개");
    const descriptionString = formData.get("description") as string;
    // 이미지는 클라이언트에서 업로드 완료 후 URL로 전달됨
    const newThumbnailUrl = formData.get("thumbnailUrl") as string | null;
    const newDetailImageUrls = formData.getAll("detailImageUrls") as string[];

    const websiteLinks = formData.getAll("links_website") as string[];
    const googlePlayLink = formData.get("links_google_play") as string | null;
    const appStoreLink = formData.get("links_app_store") as string | null;

    const { data: oldShowcaseData } = await supabase
      .from("showcases")
      .select("thumbnail_url, images, user_id, slug")
      .eq("id", showcaseId)
      .single();

    if (oldShowcaseData?.user_id !== user.id) {
      return { error: "수정할 권한이 없습니다." };
    }

    // 제거된 이미지를 storage에서 삭제 (admin client 사용 - 구 경로 파일 호환)
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const oldThumbnailUrl = oldShowcaseData?.thumbnail_url;
    if (oldThumbnailUrl && oldThumbnailUrl !== newThumbnailUrl) {
      const oldPath = oldThumbnailUrl.split("/storage/v1/object/public/showcases/")[1];
      if (oldPath) await deleteFile(adminClient, "showcases", oldPath);
    }

    const oldImages = (oldShowcaseData?.images as string[] | null) ?? [];
    const removedImages = oldImages.filter((url) => !newDetailImageUrls.includes(url));
    await Promise.allSettled(
      removedImages.map(async (url) => {
        const path = url.split("/storage/v1/object/public/showcases/")[1];
        if (path) await deleteFile(adminClient, "showcases", path);
      }),
    );

    let processedDescription: any = descriptionString;
    
    try {
      processedDescription = JSON.parse(descriptionString);
    } catch (e) {
      processedDescription = descriptionString ? await processMentionsForSave(descriptionString, supabase) : null;
    }

    const updateData: { 
      name: string; 
      short_description: string; 
      description: string | null; 
      thumbnail_url?: string | null;
      web_url?: string | null;
      playstore_url?: string | null;
      appstore_url?: string | null;
      images?: string[];
      slug?: string;
    } = {
      name,
      short_description: shortDescription,
      description: processedDescription,
      web_url: websiteLinks[0] || null,
      playstore_url: googlePlayLink || null,
      appstore_url: appStoreLink || null,
    };

    // Only set slug if it doesn't exist yet (Immutable)
    if (!oldShowcaseData?.slug) {
      let slug = generateSlug(name);
      if (!slug) slug = "project";
      
      const { data: existingSlug } = await supabase
        .from("showcases")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existingSlug) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }
      updateData.slug = slug;
    }
    updateData.thumbnail_url = newThumbnailUrl || null;
    updateData.images = newDetailImageUrls;

    const { error } = await supabase
      .from("showcases")
      .update(updateData)
      .eq("id", showcaseId);

    if (error) {
      return { error: `쇼케이스 업데이트 실패: ${error.message}` };
    }

    // --- Update Members ---
    await supabase.from("showcases_members").delete().eq("showcase_id", showcaseId);

    const teamMembersJson = formData.get("teamMembers") as string | null;
    if (teamMembersJson) {
      try {
        const teamMemberIds = JSON.parse(teamMembersJson) as string[];
        if (teamMemberIds.length > 0) {
          const membersToInsert = teamMemberIds.map((userId, index) => ({
            showcase_id: showcaseId,
            user_id: userId,
            display_order: index,
          }));
          await supabase.from("showcases_members").insert(membersToInsert);
        }
      } catch (e) {
        console.error("Error parsing team members JSON:", e);
      }
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

// Increments view count via SECURITY DEFINER RPC (bypasses RLS)
export async function incrementShowcaseView(showcaseId: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.rpc("increment_showcase_view", { p_showcase_id: showcaseId });
}
