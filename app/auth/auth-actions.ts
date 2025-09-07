"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth, withErrorHandling } from "@/lib/error-handler";
import { DeleteResponse, createSuccessResponse } from "@/lib/types/api";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}

export async function deleteAccount(): Promise<DeleteResponse> {
  return withErrorHandling(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = requireAuth(user?.id);

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Delete user's avatar from storage
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw new Error(`프로필 조회 실패: ${profileError.message}`);
    }

    if (profileData?.avatar_url) {
      const avatarPath = profileData.avatar_url.split("/avatars/").pop();
      if (avatarPath) {
        const { error: storageError } = await supabaseAdmin.storage
          .from("avatars")
          .remove([avatarPath]);
        if (storageError) {
          console.error("아바타 삭제 실패:", storageError);
          // Don't throw, continue with account deletion
        }
      }
    }

    // 2. Delete logs and their images
    const { data: logsData, error: logsError } = await supabase
      .from("logs")
      .select("id, image_url")
      .eq("user_id", userId);

    if (logsError) {
      throw new Error(`로그 조회 실패: ${logsError.message}`);
    }

    for (const log of logsData) {
      if (log.image_url) {
        const logPath = log.image_url.split("/logs/").pop();
        if (logPath) {
          const { error: storageError } = await supabaseAdmin.storage
            .from("logs")
            .remove([logPath]);
          if (storageError) {
            console.error(`로그 이미지 삭제 실패 (${log.id}):`, storageError);
          }
        }
      }
    }
    // Logs will be deleted by RLS policy on user deletion, or by explicit delete if needed
    // For now, relying on cascade delete if set up, or admin delete later.

    // 3. Delete clubs owned by the user and their thumbnails
    const { data: clubsData, error: clubsError } = await supabase
      .from("clubs")
      .select("id, thumbnail_url")
      .eq("owner_id", userId);

    if (clubsError) {
      throw new Error(`클럽 조회 실패: ${clubsError.message}`);
    }

    for (const club of clubsData) {
      if (club.thumbnail_url) {
        const clubPath = club.thumbnail_url.split("/clubs/").pop();
        if (clubPath) {
          const { error: storageError } = await supabaseAdmin.storage
            .from("clubs")
            .remove([clubPath]);
          if (storageError) {
            console.error(`클럽 썸네일 삭제 실패 (${club.id}):`, storageError);
          }
        }
      }
    }
    // Clubs will be deleted by RLS policy on user deletion, or by explicit delete if needed

    // 4. Delete meetups organized by the user and their thumbnails
    const { data: meetupsData, error: meetupsError } = await supabase
      .from("meetups")
      .select("id, thumbnail_url")
      .eq("organizer_id", userId);

    if (meetupsError) {
      throw new Error(`밋업 조회 실패: ${meetupsError.message}`);
    }

    for (const meetup of meetupsData) {
      if (meetup.thumbnail_url) {
        const meetupPath = meetup.thumbnail_url.split("/meetups/").pop();
        if (meetupPath) {
          const { error: storageError } = await supabaseAdmin.storage
            .from("meetups")
            .remove([meetupPath]);
          if (storageError) {
            console.error(`밋업 썸네일 삭제 실패 (${meetup.id}):`, storageError);
          }
        }
      }
    }
    // Meetups will be deleted by RLS policy on user deletion, or by explicit delete if needed

    // 5. Delete the user from Supabase Auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      throw new Error(`사용자 삭제 실패: ${deleteUserError.message}`);
    }

    // Revalidate and redirect
    revalidatePath("/", "layout");
    redirect("/");

    return createSuccessResponse(undefined);
  });
}
