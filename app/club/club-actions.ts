"use server";

import { revalidatePath } from "next/cache";
import { Enums } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { CLUB_MEMBER_ROLES, CLUB_PERMISSION_LEVELS } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import { handleClubContentImages, handlePostContentImages } from "@/lib/storage";
import {
  CreateResponse,
  UpdateResponse,
  createSuccessResponse,
} from "@/lib/types/api";
import {
  validateRequired,
  withAuth,
} from "@/lib/error-handler";
import { createClient } from "@/lib/supabase/server";

export const createClub = withAuth(async ({ supabase, user }, formData: FormData): Promise<CreateResponse> => {
  const userId = user.id;
  const id = uuidv4();

  const name = validateRequired(formData.get("name") as string, "클럽 이름");
  const tagline = formData.get("tagline") as string;
  const descriptionJSON = formData.get("description") as string;

  const { thumbnailUrl, processedContent } = await handleClubContentImages({
    formData,
    resourceId: id,
    bucketName: "clubs",
    contentJson: descriptionJSON,
  });

  const { data: newClub, error } = await supabase
    .from("clubs")
    .insert({
      id,
      name,
      tagline,
      description: processedContent,
      thumbnail_url: thumbnailUrl,
      owner_id: userId,
    })
    .select("id")
    .single();

  if (error || !newClub) {
    throw new Error(error?.message || "클럽 생성에 실패했습니다");
  }

  await supabase
    .from("club_members")
    .insert({
      club_id: newClub.id,
      user_id: userId,
      role: CLUB_MEMBER_ROLES.LEADER,
    });

  revalidatePath("/club");

  return createSuccessResponse({ id: newClub.id });
});

export const updateClub = withAuth(async ({ supabase, user }, formData: FormData): Promise<UpdateResponse> => {
  const userId = user.id;
  const clubId = validateRequired(formData.get("id") as string, "클럽 ID");

  const { data: existingClub, error: fetchError } = await supabase
    .from("clubs")
    .select("owner_id, thumbnail_url")
    .eq("id", clubId)
    .single();

  if (fetchError || !existingClub) {
    throw new Error("클럽을 찾을 수 없거나 권한이 없습니다.");
  }

  if (existingClub.owner_id !== userId) {
    throw new Error("클럽을 수정할 권한이 없습니다.");
  }

  const descriptionJSON = formData.get("description") as string;

  const { thumbnailUrl, processedContent } = await handleClubContentImages({
    formData,
    resourceId: clubId,
    bucketName: "clubs",
    contentJson: descriptionJSON,
    existingThumbnailUrl: existingClub.thumbnail_url,
  });

  const updateData = {
    name: formData.get("name") as string,
    tagline: formData.get("tagline") as string,
    description: processedContent,
    thumbnail_url: thumbnailUrl,
  };

  const { error: updateError } = await supabase
    .from("clubs")
    .update(updateData)
    .eq("id", clubId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath(`/club`);
  revalidatePath(`/club/${clubId}`);
  revalidatePath(`/club/${clubId}/edit`);

  return createSuccessResponse(undefined);
});

export const joinClub = withAuth(async ({ supabase, user }, clubId: string) => {
  const { error } = await supabase.from("club_members").insert({
    club_id: clubId,
    user_id: user.id,
    role: CLUB_MEMBER_ROLES.GENERAL_MEMBER,
  });

  if (error) {
    console.error("Error joining club:", error);
    return { error: "클럽 가입 중 오류가 발생했습니다." };
  }

  revalidatePath(`/club/${clubId}`);
  return { success: true };
});

export const leaveClub = withAuth(async ({ supabase, user }, clubId: string) => {
  const { error } = await supabase
    .from("club_members")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error leaving club:", error);
    return { error: "클럽 탈퇴 중 오류가 발생했습니다." };
  }

  revalidatePath(`/club/${clubId}`);
  return { success: true };
});

export const createClubPost = withAuth(async ({ supabase, user }, formData: FormData): Promise<{ error?: string; postId?: string }> => {
  try {
    const title = validateRequired(formData.get("title") as string, "제목");
    const contentJSON = validateRequired(formData.get("content") as string, "내용");
    const forumId = validateRequired(formData.get("forumId") as string, "게시판");
    const clubId = validateRequired(formData.get("clubId") as string, "클럽 ID");

    // Insert post first to get an ID, with initial empty content
    const { data: newPost, error: insertError } = await supabase
      .from("club_forum_posts")
      .insert({
        forum_id: forumId,
        user_id: user.id,
        title: title,
        content: JSON.parse(contentJSON), // Start with blob-URL content
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);
    const postId = newPost.id;

    // Handle image uploads and get processed content
    const { processedContent } = await handlePostContentImages({
      formData,
      clubId,
      forumId,
      postId,
      contentJson: contentJSON,
    });

    // Update post with final content containing public URLs
    const { error: updateError } = await supabase
      .from("club_forum_posts")
      .update({ content: processedContent })
      .eq("id", postId);

    if (updateError) throw new Error(updateError.message);

    revalidatePath(`/club/${clubId}`);
    revalidatePath(`/club/${clubId}/post/${postId}`);

    return { postId };
  } catch (e) {
    const error = e as Error;
    console.error("Create club post error:", error.message);
    return { error: error.message };
  }
});

export const updateClubPost = withAuth(async ({ supabase, user }, formData: FormData): Promise<{ error?: string; postId?: string }> => {
  try {
    const postId = validateRequired(formData.get("postId") as string, "게시글 ID");
    const title = validateRequired(formData.get("title") as string, "제목");
    const contentJSON = validateRequired(formData.get("content") as string, "내용");
    const clubId = validateRequired(formData.get("clubId") as string, "클럽 ID");

    const { data: existingPost, error: fetchError } = await supabase
      .from("club_forum_posts")
      .select("user_id, forum_id")
      .eq("id", postId)
      .single();

    if (fetchError || !existingPost) {
      throw new Error("게시글을 찾을 수 없거나 수정할 권한이 없습니다.");
    }
    if (existingPost.user_id !== user.id) {
      throw new Error("게시글을 수정할 권한이 없습니다.");
    }

    const { processedContent } = await handlePostContentImages({
      formData,
      clubId,
      forumId: existingPost.forum_id,
      postId,
      contentJson: contentJSON,
    });

    const { error: updateError } = await supabase
      .from("club_forum_posts")
      .update({ title, content: processedContent })
      .eq("id", postId);

    if (updateError) throw new Error(updateError.message);

    revalidatePath(`/club/${clubId}`);
    revalidatePath(`/club/${clubId}/post/${postId}`);

    return { postId };
  } catch (e) {
    const error = e as Error;
    console.error("Update club post error:", error.message);
    return { error: error.message };
  }
});

export const createClubPostComment = withAuth(async ({ supabase, user },
  postId: string,
  content: string,
  parentCommentId: string | null = null
) => {
  if (!content.trim()) {
    return { error: "댓글 내용을 입력해주세요." };
  }

  const { data: comment, error } = await supabase
    .from("club_forum_post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content,
      parent_comment_id: parentCommentId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating club post comment:", error);
    return { error: "댓글 작성 중 오류가 발생했습니다." };
  }

  const { data: postData, error: postError } = await supabase
    .from("club_forum_posts")
    .select("forum_id")
    .eq("id", postId)
    .single();

  if (postError || !postData?.forum_id) {
    console.error("Error fetching forum_id for post:", postError);
  } else {
    const { data: forumData, error: forumError } = await supabase
      .from("club_forums")
      .select("club_id")
      .eq("id", postData.forum_id)
      .single();

    if (forumError || !forumData?.club_id) {
      console.error("Error fetching club_id for forum:", forumError);
    } else {
      revalidatePath(`/club/${forumData.club_id}/post/${postId}`);
    }
  }

  return { success: true, commentId: comment.id };
});

export const updateClubPostComment = withAuth(async ({ supabase, user },
  commentId: string,
  content: string
) => {
  if (!content.trim()) {
    return { error: "댓글 내용을 입력해주세요." };
  }

  const { error } = await supabase
    .from("club_forum_post_comments")
    .update({ content: content, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating club post comment:", error);
    return { error: "댓글 수정 중 오류가 발생했습니다." };
  }

  const { data: commentData, error: commentError } = await supabase
    .from("club_forum_post_comments")
    .select("post_id")
    .eq("id", commentId)
    .single();

  if (commentError || !commentData?.post_id) {
    console.error("Error fetching post_id for comment:", commentError);
  } else {
    const { data: postData, error: postError } = await supabase
      .from("club_forum_posts")
      .select("forum_id")
      .eq("id", commentData.post_id)
      .single();

    if (postError || !postData?.forum_id) {
      console.error("Error fetching forum_id for post:", postError);
    } else {
      const { data: forumData, error: forumError } = await supabase
        .from("club_forums")
        .select("club_id")
        .eq("id", postData.forum_id)
        .single();

      if (forumError || !forumData?.club_id) {
        console.error("Error fetching club_id for forum:", forumError);
      } else {
        revalidatePath(
          `/club/${forumData.club_id}/post/${commentData.post_id}`
        );
      }
    }
  }

  return { success: true };
});

export async function fetchClubPostComments(
  postId: string,
  page: number = 1,
  limit: number = 10
) {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // Fetch all comments and replies in a single query
  const { data: allComments, error } = await supabase
    .from("club_forum_post_comments")
    .select(
      `
      *,
      author:profiles(*)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching club post comments:", error);
    return { comments: [], error: error.message };
  }

  // Separate parent comments and replies
  const parentComments = (allComments || []).filter(
    (comment) => !comment.parent_comment_id
  );
  const repliesMap = new Map();

  // Group replies by parent comment ID
  (allComments || []).forEach((comment) => {
    if (comment.parent_comment_id) {
      if (!repliesMap.has(comment.parent_comment_id)) {
        repliesMap.set(comment.parent_comment_id, []);
      }
      repliesMap.get(comment.parent_comment_id).push(comment);
    }
  });

  // Apply pagination to parent comments only
  const paginatedParentComments = parentComments.slice(offset, offset + limit);

  // Build comments with their replies
  const commentsWithReplies = paginatedParentComments.map((comment) => ({
    ...comment,
    replies: repliesMap.get(comment.id) || [],
  }));

  // Use the already fetched parent comments count for better performance
  const totalCount = parentComments.length;

  return { comments: commentsWithReplies, count: totalCount, error: null };
}

export const deleteClubPostComment = withAuth(async ({ supabase, user }, commentId: string) => {
  const { data: commentData, error: commentFetchError } = await supabase
    .from("club_forum_post_comments")
    .select("post_id")
    .eq("id", commentId)
    .single();

  if (commentFetchError || !commentData?.post_id) {
    console.error("Error fetching comment for deletion:", commentFetchError);
    return { error: "댓글을 찾을 수 없습니다." };
  }

  const { error } = await supabase
    .from("club_forum_post_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting club post comment:", error);
    return { error: "댓글 삭제 중 오류가 발생했습니다." };
  }

  const { data: postData, error: postError } = await supabase
    .from("club_forum_posts")
    .select("forum_id")
    .eq("id", commentData.post_id)
    .single();

  if (postError || !postData?.forum_id) {
    console.error("Error fetching forum_id for post:", postError);
  } else {
    const { data: forumData, error: forumError } = await supabase
      .from("club_forums")
      .select("club_id")
      .eq("id", postData.forum_id)
      .single();

    if (forumError || !forumData?.club_id) {
      console.error("Error fetching club_id for forum:", forumError);
    } else {
      revalidatePath(`/club/${forumData.club_id}/post/${commentData.post_id}`);
    }
  }

  return { success: true };
});

export const updateForumPermissions = withAuth(async ({ supabase, user }, params: {
  forumId: string;
  clubId: string;
  readPermission: Enums<"club_permission_level_enum">;
  writePermission: Enums<"club_permission_level_enum">;
}) => {
  const { forumId, clubId, readPermission, writePermission } = params;

  const { data: club, error: fetchError } = await supabase
    .from("clubs")
    .select("owner_id")
    .eq("id", clubId)
    .single();

  if (fetchError || !club) {
    console.error("Error fetching club for permission update:", fetchError);
    return { error: "클럽 정보를 찾을 수 없습니다." };
  }

  if (club.owner_id !== user.id) {
    return { error: "클럽장만 권한을 수정할 수 있습니다." };
  }

  const { error: updateError } = await supabase
    .from("club_forums")
    .update({
      read_permission: readPermission,
      write_permission: writePermission,
    })
    .eq("id", forumId);

  if (updateError) {
    console.error("Error updating forum permissions:", updateError);
    return { error: "게시판 권한 업데이트 중 오류가 발생했습니다." };
  }

  revalidatePath(`/club/${clubId}`);
  revalidatePath(`/club/${clubId}/manage`);
  return { success: true };
});

async function isClubOwner(
  supabase: SupabaseClient,
  clubId: string,
  userId: string
) {
  const { data: club, error } = await supabase
    .from("clubs")
    .select("owner_id")
    .eq("id", clubId)
    .single();

  if (error || !club) {
    return false;
  }

  return club.owner_id === userId;
}

export const createForum = withAuth(async ({ supabase, user }, clubId: string, forumName: string) => {
  if (!(await isClubOwner(supabase, clubId, user.id))) {
    return { error: "클럽장만 게시판을 생성할 수 있습니다." };
  }

  const { error } = await supabase.from("club_forums").insert({
    club_id: clubId,
    name: forumName,
    description: "",
    read_permission: CLUB_PERMISSION_LEVELS.MEMBER,
    write_permission: CLUB_PERMISSION_LEVELS.MEMBER,
  });

  if (error) {
    console.error("Error creating forum:", error);
    if (error.code === "23505") {
      return { error: `'${forumName}' 게시판은 이미 존재합니다.` };
    }
    return { error: "게시판 생성 중 오류가 발생했습니다." };
  }

  revalidatePath(`/club/${clubId}/manage`);
  return { success: true };
});

export const updateForumName = withAuth(async ({ supabase, user },
  forumId: string,
  newName: string,
  clubId: string
) => {
  if (!(await isClubOwner(supabase, clubId, user.id))) {
    return { error: "클럽장만 게시판을 수정할 수 있습니다." };
  }

  const { error } = await supabase
    .from("club_forums")
    .update({ name: newName })
    .eq("id", forumId);

  if (error) {
    console.error("Error updating forum name:", error);
    if (error.code === "23505") {
      return { error: `'${newName}' 게시판은 이미 존재합니다.` };
    }
    return { error: "게시판 이름 변경 중 오류가 발생했습니다." };
  }

  revalidatePath(`/club/${clubId}/manage`);
  return { success: true };
});

export const deleteForum = withAuth(async ({ supabase, user }, forumId: string, clubId: string) => {
  if (!(await isClubOwner(supabase, clubId, user.id))) {
    return { error: "클럽장만 게시판을 삭제할 수 있습니다." };
  }

  const { count, error: postsError } = await supabase
    .from("club_forum_posts")
    .select("id", { count: "exact", head: true })
    .eq("forum_id", forumId);

  if (postsError) {
    console.error("Error checking for posts in forum:", postsError);
    return { error: "게시글 확인 중 오류가 발생했습니다." };
  }

  if (count && count > 0) {
    return { error: "게시글이 있는 게시판은 삭제할 수 없습니다." };
  }

  const { error: deleteError } = await supabase
    .from("club_forums")
    .delete()
    .eq("id", forumId);

  if (deleteError) {
    console.error("Error deleting forum:", deleteError);
    return { error: "게시판 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath(`/club/${clubId}/manage`);
  return { success: true };
});

export const updateForumOrder = withAuth(async ({ supabase, user },
  clubId: string,
  orderedForumIds: string[]
) => {
  if (!(await isClubOwner(supabase, clubId, user.id))) {
    return { error: "클럽장만 게시판 순서를 변경할 수 있습니다." };
  }

  const { data: existingForums, error: fetchError } = await supabase
    .from("club_forums")
    .select("id, club_id, name, read_permission, write_permission, description")
    .in("id", orderedForumIds);

  if (fetchError) {
    console.error(
      "Error fetching existing forums for order update:",
      fetchError
    );
    return { error: "게시판 정보를 가져오는 중 오류가 발생했습니다." };
  }

  const updates = orderedForumIds.map((forumId, index) => {
    const existingForum = existingForums?.find((f) => f.id === forumId);
    if (!existingForum) {
      throw new Error(`Forum with ID ${forumId} not found.`);
    }
    return {
      id: forumId,
      position: index,
      club_id: existingForum.club_id,
      name: existingForum.name,
      read_permission: existingForum.read_permission,
      write_permission: existingForum.write_permission,
      description: existingForum.description,
    };
  });

  const { error } = await supabase
    .from("club_forums")
    .upsert(updates, { onConflict: "id" });

  if (error) {
    console.error("Error updating forum order:", error);
    return { error: "게시판 순서 변경 중 오류가 발생했습니다." };
  }

  revalidatePath(`/club/${clubId}/manage`);
  revalidatePath(`/club/${clubId}`);
  return { success: true };
});

export const deleteClubPost = withAuth(async ({ supabase, user }, postId: string) => {
  const { data: post, error: fetchError } = await supabase
    .from("club_forum_posts")
    .select("user_id, forum_id")
    .eq("id", postId)
    .single();

  if (fetchError || !post) {
    return { error: "게시글을 찾을 수 없습니다." };
  }

  if (post.user_id !== user.id) {
    return { error: "작성자만 삭제할 수 있습니다." };
  }

  const { error: deleteError } = await supabase
    .from("club_forum_posts")
    .delete()
    .eq("id", postId);

  if (deleteError) {
    console.error("Error deleting post:", deleteError);
    return { error: "게시글 삭제 중 오류가 발생했습니다." };
  }

  const { data: forum } = await supabase
    .from("club_forums")
    .select("club_id")
    .eq("id", post.forum_id)
    .single();

  if (forum?.club_id) {
    revalidatePath(`/club/${forum.club_id}`);
  }

  return { success: true };
});
