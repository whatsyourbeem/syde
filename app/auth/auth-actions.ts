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

    // Delete storage files (these won't be automatically deleted by CASCADE)
    // 1. Delete user's avatar
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (profileData?.avatar_url) {
      const avatarPath = profileData.avatar_url.split("/profiles/").pop();
      if (avatarPath) {
        await supabaseAdmin.storage.from("profiles").remove([avatarPath]);
      }
    }

    // 2. Delete user's log images
    const { data: logsData } = await supabaseAdmin
      .from("logs")
      .select("image_url")
      .eq("user_id", userId);

    if (logsData) {
      for (const log of logsData) {
        if (log.image_url) {
          const logPath = log.image_url.split("/logimages/").pop();
          if (logPath) {
            await supabaseAdmin.storage.from("logimages").remove([logPath]);
          }
        }
      }
    }

    // 3. Delete user's club thumbnails
    const { data: clubsData } = await supabaseAdmin
      .from("clubs")
      .select("thumbnail_url")
      .eq("owner_id", userId);

    if (clubsData) {
      for (const club of clubsData) {
        if (club.thumbnail_url) {
          const clubPath = club.thumbnail_url.split("/clubs/").pop();
          if (clubPath) {
            await supabaseAdmin.storage.from("clubs").remove([clubPath]);
          }
        }
      }
    }

    // 4. Delete user's meetup thumbnails
    const { data: meetupsData } = await supabaseAdmin
      .from("meetups")
      .select("thumbnail_url")
      .eq("organizer_id", userId);

    if (meetupsData) {
      for (const meetup of meetupsData) {
        if (meetup.thumbnail_url) {
          const meetupPath = meetup.thumbnail_url.split("/meetup-images/").pop();
          if (meetupPath) {
            await supabaseAdmin.storage.from("meetup-images").remove([meetupPath]);
          }
        }
      }
    }

    // 5. Delete the user from Supabase Auth
    // This will cascade delete all related database records
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
