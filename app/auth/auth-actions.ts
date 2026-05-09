"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth, withErrorHandling } from "@/lib/error-handler";
import { DeleteResponse, createSuccessResponse } from "@/lib/types/api";
import { getAdminClient } from "@/lib/supabase/admin";
import { extractStoragePath } from "@/lib/storage";

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

    const adminClient = getAdminClient();

    // Delete storage files (these won't be automatically deleted by CASCADE)
    // 1. Delete user's avatar
    const { data: profileData } = await adminClient
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (profileData?.avatar_url) {
      const avatarPath = extractStoragePath(profileData.avatar_url, "profiles");
      if (avatarPath) {
        await adminClient.storage.from("profiles").remove([avatarPath]);
      }
    }

    // 2. Delete user's log images
    const { data: logsData } = await adminClient
      .from("logs")
      .select("image_url")
      .eq("user_id", userId);

    if (logsData) {
      for (const log of logsData) {
        if (log.image_url) {
          const logPath = extractStoragePath(log.image_url, "logimages");
          if (logPath) {
            await adminClient.storage.from("logimages").remove([logPath]);
          }
        }
      }
    }

    // 3. Delete user's club thumbnails
    const { data: clubsData } = await adminClient
      .from("clubs")
      .select("thumbnail_url")
      .eq("owner_id", userId);

    if (clubsData) {
      for (const club of clubsData) {
        if (club.thumbnail_url) {
          const clubPath = extractStoragePath(club.thumbnail_url, "clubs");
          if (clubPath) {
            await adminClient.storage.from("clubs").remove([clubPath]);
          }
        }
      }
    }

    // 4. Delete user's meetup thumbnails
    const { data: meetupsData } = await adminClient
      .from("meetups")
      .select("thumbnail_url")
      .eq("organizer_id", userId);

    if (meetupsData) {
      for (const meetup of meetupsData) {
        if (meetup.thumbnail_url) {
          const meetupPath = extractStoragePath(meetup.thumbnail_url, "meetup-images");
          if (meetupPath) {
            await adminClient.storage.from("meetup-images").remove([meetupPath]);
          }
        }
      }
    }

    // 5. Delete the user from Supabase Auth
    // This will cascade delete all related database records
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      throw new Error(`사용자 삭제 실패: ${deleteUserError.message}`);
    }

    // Revalidate and redirect
    revalidatePath("/", "layout");
    redirect("/");

    return createSuccessResponse(undefined);
  });
}
