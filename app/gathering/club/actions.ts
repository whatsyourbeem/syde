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

export async function updateClub(
  clubId: string,
  name: string,
  descriptionString: string, // Change type to string
  thumbnailUrl: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
      description: description, // Now 'description' is a parsed Json object
      thumbnail_url: thumbnailUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clubId);

  if (error) {
    console.error("Error updating club:", error);
    return { error: "클럽 정보 업데이트 중 오류가 발생했습니다." };
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
    .select('id') // Select the id of the newly created post
    .single();

  if (error) {
    console.error("Error creating post:", error);
    return { error: "게시글 작성 중 오류가 발생했습니다." };
  }

  revalidatePath(`/gathering/club/${forum.club_id}`);

  return { success: true, postId: post.id };
}

export async function createClubPostComment(
  postId: string,
  content: string, // Assuming content is plain text for now, similar to log_comments
  parentCommentId: string | null = null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
      revalidatePath(`/gathering/club/${forumData.club_id}/post/${postId}`);
    }
  }

  return { success: true, commentId: comment.id };
}

export async function updateClubPostComment(
  commentId: string,
  content: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
        revalidatePath(`/gathering/club/${forumData.club_id}/post/${commentData.post_id}`);
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
      author:profiles(id, username, full_name, avatar_url)
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
          author:profiles(id, username, full_name, avatar_url)
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
    return { comments: commentsWithReplies, count: 0, error: countError.message };
  }

  return { comments: commentsWithReplies, count: count || 0, error: null };
}

export async function deleteClubPostComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
      revalidatePath(`/gathering/club/${forumData.club_id}/post/${commentData.post_id}`);
    }
  }

  return { success: true };
}
