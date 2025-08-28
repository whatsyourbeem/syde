"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Json, Enums } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

export async function joinClub(clubId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  revalidatePath(`/socialing/club/${clubId}`);
  return { success: true };
}

export async function leaveClub(clubId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  revalidatePath(`/socialing/club/${clubId}`);
  return { success: true };
}

export async function updateClub(
  clubId: string,
  name: string,
  tagline: string,
  descriptionString: string, // Change type to string
  thumbnailUrl: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // Parse the incoming description string
  let description: Json | null = null;
  try {
    description = JSON.parse(descriptionString);
  } catch (e) {
    console.error("Failed to parse club description JSON string:", e);
    return { error: "Invalid club description content format." };
  }

  // Fetch club to verify ownership
  const { data: club, error: fetchError } = await supabase
    .from("clubs")
    .select("owner_id")
    .eq("id", clubId)
    .single();

  if (fetchError || !club) {
    console.error("Error fetching club for update:", fetchError);
    return { error: "클럽 정보를 찾을 수 없습니다." };
  }

  if (club.owner_id !== user.id) {
    return { error: "클럽장만 클럽 정보를 수정할 수 있습니다." };
  }

  const { error } = await supabase
    .from("clubs")
    .update({
      name: name,
      tagline: tagline,
      description: description, // Now 'description' is a parsed Json object
      thumbnail_url: thumbnailUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clubId);

  if (error) {
    console.error("Error updating club:", error);
    return { error: "클럽 정보 업데이트 중 오류가 발생했습니다." };
  }

  revalidatePath(`/socialing/club/${clubId}`);
  revalidatePath(`/socialing/club/${clubId}/edit`);
  return { success: true };
}

export async function uploadClubThumbnail(clubId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  console.log("Uploading thumbnail for club:", clubId);
  console.log("User ID:", user.id);

  // Fetch club to verify ownership
  const { data: club, error: fetchError } = await supabase
    .from("clubs")
    .select("owner_id")
    .eq("id", clubId)
    .single();

  if (fetchError || !club) {
    console.error("Error fetching club for ownership check:", fetchError);
    return { error: "클럽 정보를 찾을 수 없습니다." };
  }

  console.log("Club owner ID:", club.owner_id);

  if (club.owner_id !== user.id) {
    console.error("User is not the owner of the club.");
    return { error: "클럽장만 썸네일을 변경할 수 있습니다." };
  }

  const file = formData.get("thumbnail") as File;
  if (!file) {
    return { error: "이미지 파일을 선택해주세요." };
  }

  const filePath = `thumbnails/${clubId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("clubs") // Correct bucket name
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading thumbnail:", uploadError);
    return { error: "썸네일 업로드 중 오류가 발생했습니다." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("clubs").getPublicUrl(filePath);

  if (!publicUrl) {
    return { error: "썸네일 URL을 가져오는데 실패했습니다." };
  }

  return { success: true, url: publicUrl };
}

export async function uploadClubDescriptionImage(
  clubId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // Verify ownership to prevent unauthorized uploads
  const { data: club, error: fetchError } = await supabase
    .from("clubs")
    .select("owner_id")
    .eq("id", clubId)
    .single();

  if (fetchError || !club || club.owner_id !== user.id) {
    return { error: "클럽장만 이미지를 업로드할 수 있습니다." };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "이미지 파일을 선택해주세요." };
  }

  const filePath = `descriptions/${clubId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("clubs")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading description image:", uploadError);
    return { error: "이미지 업로드 중 오류가 발생했습니다." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("clubs").getPublicUrl(filePath);

  if (!publicUrl) {
    return { error: "이미지 URL을 가져오는데 실패했습니다." };
  }

  return { success: true, url: publicUrl };
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

  // Find the club_id from the forum first
  const { data: forum, error: forumError } = await supabase
    .from("club_forums")
    .select("club_id")
    .eq("id", forumId)
    .single();

  if (forumError || !forum?.club_id) {
    console.error("Error finding club for forum:", forumError);
    return { error: "클럽 정보를 찾을 수 없습니다." };
  }

  const { data: post, error } = await supabase
    .from("club_forum_posts")
    .insert({
      forum_id: forumId, // Corrected to use forum_id
      user_id: user.id,
      title: title,
      content: content,
    })
    .select("id") // Select the id of the newly created post
    .single();

  if (error) {
    console.error("Error creating post:", error);
    return { error: "게시글 작성 중 오류가 발생했습니다." };
  }

  revalidatePath(`/socialing/club/${forum.club_id}`);

  return { success: true, postId: post.id };
}

export async function createClubPostComment(
  postId: string,
  content: string, // Assuming content is plain text for now, similar to log_comments
  parentCommentId: string | null = null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

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

  // Revalidate path for the post detail page
  // Need to get club_id from post_id -> forum_id -> club_id
  const { data: postData, error: postError } = await supabase
    .from("club_forum_posts")
    .select("forum_id")
    .eq("id", postId)
    .single();

  if (postError || !postData?.forum_id) {
    console.error("Error fetching forum_id for post:", postError);
    // Still return success for comment creation, but log the revalidation issue
  } else {
    const { data: forumData, error: forumError } = await supabase
      .from("club_forums")
      .select("club_id")
      .eq("id", postData.forum_id)
      .single();

    if (forumError || !forumData?.club_id) {
      console.error("Error fetching club_id for forum:", forumError);
    } else {
      revalidatePath(`/socialing/club/${forumData.club_id}/post/${postId}`);
    }
  }

  return { success: true, commentId: comment.id };
}

export async function updateClubPostComment(
  commentId: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (!content.trim()) {
    return { error: "댓글 내용을 입력해주세요." };
  }

  const { error } = await supabase
    .from("club_forum_post_comments")
    .update({ content: content, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", user.id); // Ensure only the owner can update

  if (error) {
    console.error("Error updating club post comment:", error);
    return { error: "댓글 수정 중 오류가 발생했습니다." };
  }

  // Revalidate path for the post detail page
  // Need to get club_id from comment_id -> post_id -> forum_id -> club_id
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
          `/socialing/club/${forumData.club_id}/post/${commentData.post_id}`
        );
      }
    }
  }

  return { success: true };
}

export async function fetchClubPostComments(
  postId: string,
  page: number = 1,
  limit: number = 10
) {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { data: comments, error } = await supabase
    .from("club_forum_post_comments")
    .select(
      `
      *,
      author:profiles(*)
    `
    )
    .eq("post_id", postId)
    .is("parent_comment_id", null) // Fetch only top-level comments
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching club post comments:", error);
    return { comments: [], error: error.message };
  }

  // Fetch replies for each top-level comment
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const { data: replies, error: repliesError } = await supabase
        .from("club_forum_post_comments")
        .select(
          `
          *,
          author:profiles(*)
        `
        )
        .eq("parent_comment_id", comment.id)
        .order("created_at", { ascending: true });

      if (repliesError) {
        console.error("Error fetching replies:", repliesError);
        return { ...comment, replies: [] };
      }
      return { ...comment, replies };
    })
  );

  const { count, error: countError } = await supabase
    .from("club_forum_post_comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
    .is("parent_comment_id", null); // Only count top-level comments

  if (countError) {
    console.error("Error fetching club post comment count:", countError);
    return {
      comments: commentsWithReplies,
      count: 0,
      error: countError.message,
    };
  }

  return { comments: commentsWithReplies, count: count || 0, error: null };
}

export async function deleteClubPostComment(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // Get post_id before deleting the comment for revalidation
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
    .eq("user_id", user.id); // Ensure only the owner can delete

  if (error) {
    console.error("Error deleting club post comment:", error);
    return { error: "댓글 삭제 중 오류가 발생했습니다." };
  }

  // Revalidate path for the post detail page
  // Need to get club_id from post_id -> forum_id -> club_id
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
        `/socialing/club/${forumData.club_id}/post/${commentData.post_id}`
      );
    }
  }

  return { success: true };
}

export async function updateForumPermissions(params: {
  forumId: string;
  clubId: string;
  readPermission: Enums<"club_permission_level_enum">;
  writePermission: Enums<"club_permission_level_enum">;
}) {
  const { forumId, clubId, readPermission, writePermission } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // Fetch club to verify ownership
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

  revalidatePath(`/socialing/club/${clubId}`);
  revalidatePath(`/socialing/club/${clubId}/manage`);
  return { success: true };
}

// A helper function to check club ownership
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

export async function createForum(clubId: string, forumName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (!(await isClubOwner(supabase, clubId, user.id))) {
    return { error: "클럽장만 게시판을 생성할 수 있습니다." };
  }

  const { error } = await supabase.from("club_forums").insert({
    club_id: clubId,
    name: forumName,
    description: "", // Default empty description
    read_permission: "MEMBER", // Default permission
    write_permission: "MEMBER", // Default permission
  });

  if (error) {
    console.error("Error creating forum:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      return { error: `'${forumName}' 게시판은 이미 존재합니다.` };
    }
    return { error: "게시판 생성 중 오류가 발생했습니다." };
  }

  revalidatePath(`/socialing/club/${clubId}/manage`);
  return { success: true };
}

export async function updateForumName(
  forumId: string,
  newName: string,
  clubId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

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
      // Unique constraint violation
      return { error: `'${newName}' 게시판은 이미 존재합니다.` };
    }
    return { error: "게시판 이름 변경 중 오류가 발생했습니다." };
  }

  revalidatePath(`/socialing/club/${clubId}/manage`);
  return { success: true };
}

export async function deleteForum(forumId: string, clubId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (!(await isClubOwner(supabase, clubId, user.id))) {
    return { error: "클럽장만 게시판을 삭제할 수 있습니다." };
  }

  // Check if there are any posts in the forum
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

  revalidatePath(`/socialing/club/${clubId}/manage`);
  return { success: true };
}

export async function updateForumOrder(
  clubId: string,
  orderedForumIds: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (!(await isClubOwner(supabase, clubId, user.id))) {
    return { error: "클럽장만 게시판 순서를 변경할 수 있습니다." };
  }

  // Fetch existing forum data to get club_id and name for upsert
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
      // This should ideally not happen if orderedForumIds are valid
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

  // Use a transaction to ensure all updates succeed or none do
  const { error } = await supabase
    .from("club_forums")
    .upsert(updates, { onConflict: "id" });

  if (error) {
    console.error("Error updating forum order:", error);
    return { error: "게시판 순서 변경 중 오류가 발생했습니다." };
  }

  revalidatePath(`/socialing/club/${clubId}/manage`);
  revalidatePath(`/socialing/club/${clubId}`); // Revalidate club detail page as well
  return { success: true };
}
