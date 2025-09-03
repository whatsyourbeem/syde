"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Json, Enums } from "@/types/database.types";
import { SupabaseClient, createClient as createAdminClient } from "@supabase/supabase-js";
import { CLUB_MEMBER_ROLES, CLUB_PERMISSION_LEVELS } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import { redirect } from "next/navigation";

async function uploadAndGetUrl(
  adminClient: SupabaseClient,
  bucket: string,
  path: string,
  file: File,
) {
  const { data: uploadData, error: uploadError } = await adminClient.storage
    .from(bucket)
    .upload(path, file);
  if (uploadError) {
    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
  }
  const { data: urlData } = adminClient.storage
    .from(bucket)
    .getPublicUrl(uploadData.path);
  return urlData.publicUrl;
}

export async function createClub(formData: FormData): Promise<{ error?: string, clubId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const id = uuidv4();
  const name = formData.get("name") as string;
  const tagline = formData.get("tagline") as string;
  const descriptionJSON = formData.get("description") as string;
  const thumbnailFile = formData.get("thumbnailFile") as File | null;
  const descriptionImageFiles = formData.getAll("descriptionImageFiles") as File[];

  if (!name) return { error: "클럽 이름을 입력해주세요." };

  let descriptionContent = JSON.parse(descriptionJSON);
  let finalThumbnailUrl: string | null = null;

  try {
    if (thumbnailFile && thumbnailFile.size > 0) {
      const fileExt = thumbnailFile.type.split('/')[1];
      const thumbnailPath = `${id}/thumbnail/${uuidv4()}.${fileExt}`;
      finalThumbnailUrl = await uploadAndGetUrl(
        adminClient,
        "clubs",
        thumbnailPath,
        thumbnailFile
      );
    }

    if (descriptionImageFiles.length > 0) {
      const uploadPromises = descriptionImageFiles.map(async (file, index) => {
        if (file.size === 0) return null;
        const blobUrl = formData.get(`descriptionImageBlobUrl_${index}`) as string;
        const fileExt = file.type.split('/')[1];
        const descriptionPath = `${id}/description/${uuidv4()}.${fileExt}`;
        const publicUrl = await uploadAndGetUrl(
          adminClient,
          "clubs",
          descriptionPath,
          file
        );
        return { blobUrl, publicUrl };
      });

      const uploadedImages = (await Promise.all(uploadPromises)).filter(Boolean);
      let descriptionString = JSON.stringify(descriptionContent);
      uploadedImages.forEach(({ blobUrl, publicUrl }) => {
        if (blobUrl && publicUrl) {
          descriptionString = descriptionString.replace(new RegExp(blobUrl, "g"), publicUrl);
        }
      });
      descriptionContent = JSON.parse(descriptionString);
    }

    const { data: newClub, error } = await supabase.from("clubs").insert({
      id,
      name,
      tagline,
      description: descriptionContent,
      thumbnail_url: finalThumbnailUrl,
      owner_id: user.id,
    }).select('id').single();

    if (error || !newClub) {
      throw new Error(error?.message || "Failed to create club");
    }

    await supabase.from('club_members').insert({ club_id: newClub.id, user_id: user.id, role: CLUB_MEMBER_ROLES.OWNER });

    revalidatePath("/socialing/club");
    
    return { clubId: newClub.id };

  } catch (e: any) {
    console.error("Create club error:", e.message);
    return { error: e.message };
  }
}

export async function updateClub(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "로그인이 필요합니다." };

    const clubId = formData.get("id") as string;
    if (!clubId) return { error: "클럽 ID가 필요합니다." };

    const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data: existingClub, error: fetchError } = await supabase
            .from("clubs")
            .select("owner_id, thumbnail_url")
            .eq("id", clubId)
            .single();

        if (fetchError || !existingClub) {
            return { error: "클럽을 찾을 수 없거나 권한이 없습니다." };
        }

        if (existingClub.owner_id !== user.id) {
            return { error: "클럽을 수정할 권한이 없습니다." };
        }

        const thumbnailFile = formData.get("thumbnailFile") as File | null;
        let newThumbnailUrl = existingClub.thumbnail_url;

        if (thumbnailFile && thumbnailFile.size > 0) {
            const fileExt = thumbnailFile.type.split('/')[1];
            const thumbnailPath = `${clubId}/thumbnail/${uuidv4()}.${fileExt}`;
            newThumbnailUrl = await uploadAndGetUrl(
                adminClient,
                "clubs",
                thumbnailPath,
                thumbnailFile
            );
            
            if (existingClub.thumbnail_url) {
                const oldThumbnailPath = existingClub.thumbnail_url.split('/clubs/')[1];
                await adminClient.storage.from('clubs').remove([oldThumbnailPath]);
            }
        }
        
        const descriptionImageFiles = formData.getAll("descriptionImageFiles") as File[];
        const descriptionJSON = formData.get("description") as string;
        let descriptionContent = JSON.parse(descriptionJSON);

        if (descriptionImageFiles.length > 0) {
            const uploadPromises = descriptionImageFiles.map(async (file, index) => {
                if (file.size === 0) return null;
                const blobUrl = formData.get(`descriptionImageBlobUrl_${index}`) as string;
                const fileExt = file.type.split('/')[1];
                const descriptionPath = `${clubId}/description/${uuidv4()}.${fileExt}`;
                const publicUrl = await uploadAndGetUrl(
                    adminClient,
                    "clubs",
                    descriptionPath,
                    file
                );
                return { blobUrl, publicUrl };
            });

            const uploadedImages = (await Promise.all(uploadPromises)).filter(Boolean);
            let descriptionString = JSON.stringify(descriptionContent);
            uploadedImages.forEach(({ blobUrl, publicUrl }) => {
                if (blobUrl && publicUrl) {
                    descriptionString = descriptionString.replace(new RegExp(blobUrl, "g"), publicUrl);
                }
            });
            descriptionContent = JSON.parse(descriptionString);
        }

        const updateData = {
            name: formData.get("name") as string,
            tagline: formData.get("tagline") as string,
            description: descriptionContent,
            thumbnail_url: newThumbnailUrl,
            updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
            .from("clubs")
            .update(updateData)
            .eq("id", clubId);

        if (updateError) {
            throw new Error(updateError.message);
        }

        revalidatePath(`/socialing/club`);
        revalidatePath(`/socialing/club/${clubId}`);
        revalidatePath(`/socialing/club/${clubId}/edit`);

    } catch (e: any) {
        console.error("Update club error:", e.message);
        return { error: e.message };
    }

    redirect(`/socialing/club/${clubId}`);
}

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
    role: CLUB_MEMBER_ROLES.GENERAL_MEMBER,
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
      forum_id: forumId,
      user_id: user.id,
      title: title,
      content: content,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating post:", error);
    return { error: "게시글 작성 중 오류가 발생했습니다." };
  }

  revalidatePath(`/socialing/club/${forum.club_id}`);

  return { success: true, postId: post.id };
}

export async function updateClubPost(
  postId: string,
  title: string,
  content: Json
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  const { data: existingPost, error: fetchError } = await supabase
    .from("club_forum_posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (fetchError || !existingPost) {
    console.error("Error fetching existing post:", fetchError);
    return { error: "게시글을 찾을 수 없습니다." };
  }

  if (existingPost.user_id !== user.id) {
    return { error: "게시글을 수정할 권한이 없습니다." };
  }

  const { data, error } = await supabase
    .from("club_forum_posts")
    .update({ title, content })
    .eq("id", postId)
    .select("id")
    .single();

  if (error) {
    console.error("Error updating club post:", error);
    return { error: error.message };
  }

  revalidatePath(`/socialing/club/[club_id]/post/${postId}`);
  return { postId: data.id };
}

export async function createClubPostComment(
  postId: string,
  content: string,
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
    .is("parent_comment_id", null)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching club post comments:", error);
    return { comments: [], error: error.message };
  }

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
    .is("parent_comment_id", null);

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

  revalidatePath(`/socialing/club/${clubId}/manage`);
  revalidatePath(`/socialing/club/${clubId}`);
  return { success: true };
}

export async function deleteClubPost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

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
      revalidatePath(`/socialing/club/${forum.club_id}`);
  }

  return { success: true };
}