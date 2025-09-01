"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Enums } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

async function uploadAndGetUrl(
  adminClient: any,
  bucket: string,
  path: string,
  file: File
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

export async function createMeetup(formData: FormData): Promise<{ error?: string; meetupId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const id = uuidv4();
  const clubId = formData.get("clubId") as string | null;
  const title = formData.get("title") as string;
  const descriptionJSON = formData.get("description") as string;
  const thumbnailFile = formData.get("thumbnailFile") as File | null;
  const descriptionImageFiles = formData.getAll("descriptionImageFiles") as File[];

  let descriptionContent = JSON.parse(descriptionJSON);
  let finalThumbnailUrl: string | null = null;

  try {
    // 1. Upload thumbnail if it exists
    if (thumbnailFile) {
      const fileExt = thumbnailFile.name.split('.').pop();
      const thumbnailPath = `${id}/thumbnail/${uuidv4()}.${fileExt}`;
      finalThumbnailUrl = await uploadAndGetUrl(
        adminClient,
        "meetups",
        thumbnailPath,
        thumbnailFile
      );
    }

    // 2. Upload description images and replace blob URLs
    if (descriptionImageFiles.length > 0) {
      const uploadPromises = descriptionImageFiles.map(async (file, index) => {
        const blobUrl = formData.get(`descriptionImageBlobUrl_${index}`) as string;
        const fileExt = file.name.split('.').pop();
        const descriptionPath = `${id}/description/${uuidv4()}.${fileExt}`;
        const publicUrl = await uploadAndGetUrl(
          adminClient,
          "meetups",
          descriptionPath,
          file
        );
        return { blobUrl, publicUrl };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      let descriptionString = JSON.stringify(descriptionContent);
      uploadedImages.forEach(({ blobUrl, publicUrl }) => {
        descriptionString = descriptionString.replace(new RegExp(blobUrl, "g"), publicUrl);
      });
      descriptionContent = JSON.parse(descriptionString);
    }

    // 3. Insert meetup data into the database
    const meetupData = {
      id: id,
      organizer_id: user.id,
      club_id: clubId,
      title,
      description: descriptionContent,
      thumbnail_url: finalThumbnailUrl,
      category: formData.get("category") as Enums<"meetup_category_enum">,
      location_type: formData.get("locationType") as Enums<"meetup_location_type_enum">,
      status: formData.get("status") as Enums<"meetup_status_enum">,
      start_datetime: (formData.get("startDatetime") as string) || null,
      end_datetime: (formData.get("endDatetime") as string) || null,
      location_description: formData.get("locationDescription") as string,
      max_participants: parseInt(formData.get("maxParticipants") as string, 10) || null,
    };

    const { data: newMeetup, error } = await supabase.from("meetups").insert(meetupData).select('id').single();

    if (error || !newMeetup) {
      throw new Error(error?.message || "Failed to create meetup");
    }

    // 4. Add organizer as a participant
    await supabase.from('meetup_participants').insert({ meetup_id: newMeetup.id, user_id: user.id });

    revalidatePath("/socialing");
    if (clubId) revalidatePath(`/socialing/club/${clubId}`);
    
    return { meetupId: newMeetup.id };

  } catch (e: any) {
    console.error("Create meetup error:", e.message);
    // TODO: Add cleanup logic for uploaded files if DB insert fails
    return { error: e.message };
  }
}

export async function updateMeetup(formData: FormData) {
  // This function also needs to be refactored similarly to handle file updates.
  // For now, focusing on createMeetup. The logic will be very similar.
  // It will involve checking for new files, deleting old files, and updating URLs.
  return { error: "Update functionality is not yet refactored." };
}
