"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { processMentionsForSave } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

export async function createLog(formData: FormData): Promise<{ error?: string; logId?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const content = formData.get("content") as string;
  const imageFile = formData.get("imageFile") as File | null;
  const processedContent = await processMentionsForSave(content, supabase);

  // 1. Create log entry first to get the log ID
  const { data: log, error: createError } = await supabase
    .from("logs")
    .insert({ content: processedContent, user_id: user.id })
    .select("id")
    .single();

  if (createError) {
    console.error("Error creating log:", createError);
    return { error: createError.message };
  }

  // 2. If an image was uploaded, upload it and update the log
  if (imageFile && log) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const fileName = `${uuidv4()}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("logs")
      .upload(`${log.id}/${fileName}`, imageFile);

    if (uploadError) {
      console.error("Error uploading log image:", uploadError);
      await supabase.from("logs").delete().eq("id", log.id);
      return { error: "Failed to upload image." };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("logs")
      .getPublicUrl(uploadData.path);

    const { error: updateError } = await supabase
      .from("logs")
      .update({ image_url: publicUrlData.publicUrl })
      .eq("id", log.id);

    if (updateError) {
      console.error("Error updating log with image URL:", updateError);
      await supabaseAdmin.storage.from("logs").remove([uploadData.path]);
      await supabase.from("logs").delete().eq("id", log.id);
      return { error: "Failed to finalize image processing." };
    }
  }

  revalidatePath("/");
  if (user.user_metadata.username) {
    revalidatePath(`/${user.user_metadata.username}`);
  }

  return { logId: log.id };
}

export async function updateLog(formData: FormData): Promise<{ error?: string; logId?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const logId = formData.get("logId") as string;
  const content = formData.get("content") as string;
  const imageFile = formData.get("imageFile") as File | null;
  const imageRemoved = formData.get("imageRemoved") === "true";

  let imageUrl: string | null | undefined = undefined; // undefined means no change

  if (imageFile) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: oldLogData } = await supabase.from("logs").select("image_url").eq("id", logId).single();
    if (oldLogData?.image_url) {
      const oldPath = oldLogData.image_url.split("/logs/").pop();
      if (oldPath) await supabaseAdmin.storage.from("logs").remove([oldPath]);
    }

    const fileName = `${uuidv4()}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("logs")
      .upload(`${logId}/${fileName}`, imageFile);

    if (uploadError) {
      return { error: "Failed to upload new image." };
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from("logs").getPublicUrl(uploadData.path);
    imageUrl = publicUrlData.publicUrl;

  } else if (imageRemoved) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: oldLogData } = await supabase.from("logs").select("image_url").eq("id", logId).single();
    if (oldLogData?.image_url) {
      const oldPath = oldLogData.image_url.split("/logs/").pop();
      if (oldPath) await supabaseAdmin.storage.from("logs").remove([oldPath]);
    }
    imageUrl = null;
  }

  const processedContent = await processMentionsForSave(content, supabase);

  const updateData: { content: string; image_url?: string | null } = { content: processedContent };
  if (imageUrl !== undefined) {
    updateData.image_url = imageUrl;
  }

  const { error } = await supabase.from("logs").update(updateData).eq("id", logId).eq("user_id", user.id);

  if (error) {
    console.error("Error updating log:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  if (user.user_metadata.username) {
    revalidatePath(`/${user.user_metadata.username}`);
  }
  revalidatePath(`/log/${logId}`);

  return { logId: logId };
}

export async function createComment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const content = formData.get("content") as string;
  const logId = formData.get("log_id") as string;
  const parentCommentId = formData.get("parent_comment_id") as string | null;

  if (!content?.trim()) {
      return { error: "Comment cannot be empty." };
  }

  const processedContent = await processMentionsForSave(content, supabase);

  const { error } = await supabase.from("log_comments").insert({
    content: processedContent,
    log_id: logId,
    user_id: user.id,
    parent_comment_id: parentCommentId,
  });

  if (error) {
    console.error("Error creating comment:", error);
    return { error: error.message };
  }

  revalidatePath(`/log/${logId}`);
  return { success: true };
}

export async function updateComment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const content = formData.get("content") as string;
  const commentId = formData.get("comment_id") as string;
  const logId = formData.get("log_id") as string;

  if (!content?.trim()) {
    return { error: "Comment cannot be empty." };
  }

  const processedContent = await processMentionsForSave(content, supabase);

  const { error } = await supabase
    .from("log_comments")
    .update({ content: processedContent })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating comment:", error);
    return { error: error.message };
  }

  revalidatePath(`/log/${logId}`);
  return { success: true };
}

export async function deleteLog(logId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  // 1. Get the log to check for an image and verify ownership
  const { data: log, error: fetchError } = await supabase
    .from("logs")
    .select("id, user_id, image_url")
    .eq("id", logId)
    .single();

  if (fetchError || !log) {
    return { error: "Log not found." };
  }

  if (log.user_id !== user.id) {
    return { error: "Unauthorized." };
  }

  // 2. Delete the log entry from the database
  const { error: deleteLogError } = await supabase
    .from("logs")
    .delete()
    .eq("id", logId);

  if (deleteLogError) {
    console.error("Error deleting log:", deleteLogError);
    return { error: deleteLogError.message };
  }

  // 3. If there was an image, delete the corresponding storage folder and its contents
  if (log.image_url) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from("logs")
      .list(logId);

    if (listError) {
      console.error("Error listing log files for deletion:", listError);
      return { success: true, warning: "Log deleted, but failed to clean up storage." };
    }

    if (files && files.length > 0) {
      const filePaths = files.map((file) => `${logId}/${file.name}`);
      const { error: removeError } = await supabaseAdmin.storage
        .from("logs")
        .remove(filePaths);

      if (removeError) {
        console.error("Error removing log files:", removeError);
        return { success: true, warning: "Log deleted, but failed to clean up storage." };
      }
    }
  }

  revalidatePath("/");
  if (user.user_metadata.username) {
    revalidatePath(`/${user.user_metadata.username}`);
  }

  return { success: true };
}
