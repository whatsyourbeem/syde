"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database, Enums } from "@/types/database.types";
import { PostgrestError } from "@supabase/supabase-js";
import { MEETUP_PARTICIPANT_STATUSES } from "@/lib/constants";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { redirect } from "next/navigation";
import { uploadAndGetUrl, getFileExtension } from "@/lib/storage";

type MeetupWithParticipants = Database["public"]["Tables"]["meetups"]["Row"] & {
  meetup_participants: Database["public"]["Tables"]["meetup_participants"]["Row"][];
};

export async function createMeetup(
  formData: FormData
): Promise<{ error?: string; meetupId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const id = uuidv4();
  const clubId = formData.get("clubId") as string | null;
  const title = formData.get("title") as string;
  const descriptionJSON = formData.get("description") as string;
  const thumbnailFile = formData.get("thumbnailFile") as File | null;
  const descriptionImageFiles = formData.getAll(
    "descriptionImageFiles"
  ) as File[];

  let descriptionContent = JSON.parse(descriptionJSON);
  let finalThumbnailUrl: string | null = null;

  try {
    // 1. Upload thumbnail if it exists
    if (thumbnailFile && thumbnailFile.size > 0) {
      const fileExt = getFileExtension(thumbnailFile.type);
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
        const blobUrl = formData.get(
          `descriptionImageBlobUrl_${index}`
        ) as string;
        const fileExt = getFileExtension(file.type);
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
        descriptionString = descriptionString.replace(
          new RegExp(blobUrl, "g"),
          publicUrl
        );
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
      location_type: formData.get(
        "locationType"
      ) as Enums<"meetup_location_type_enum">,
      status: formData.get("status") as Enums<"meetup_status_enum">,
      start_datetime: (formData.get("startDatetime") as string) || null,
      end_datetime: (formData.get("endDatetime") as string) || null,
      location: formData.get("location") as string,
      address: formData.get("address") as string,
      max_participants:
        parseInt(formData.get("maxParticipants") as string, 10) || null,
      fee: parseInt(formData.get("fee") as string, 10) || null,
    };

    const { data: newMeetup, error } = await supabase
      .from("meetups")
      .insert(meetupData)
      .select("id")
      .single();

    if (error || !newMeetup) {
      throw new Error(error?.message || "Failed to create meetup");
    }

    // 4. Add organizer as a participant
    await supabase.from("meetup_participants").insert({
      meetup_id: newMeetup.id,
      user_id: user.id,
      status: MEETUP_PARTICIPANT_STATUSES.APPROVED,
    });

    revalidatePath("/meetup");
    if (clubId) revalidatePath(`/club/${clubId}`);

    return { meetupId: newMeetup.id };
  } catch (e) {
    console.error("Create meetup error:", (e as Error).message);
    // TODO: Add cleanup logic for uploaded files if DB insert fails
    return { error: (e as Error).message };
  }
}

export async function updateMeetup(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const meetupId = formData.get("id") as string;
  if (!meetupId) return { error: "모임 ID가 필요합니다." };

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: existingMeetup, error: fetchError } = await supabase
      .from("meetups")
      .select("organizer_id, thumbnail_url")
      .eq("id", meetupId)
      .single();

    if (fetchError || !existingMeetup) {
      return { error: "모임을 찾을 수 없거나 권한이 없습니다." };
    }

    if (existingMeetup.organizer_id !== user.id) {
      return { error: "모임을 수정할 권한이 없습니다." };
    }

    const thumbnailFile = formData.get("thumbnailFile") as File | null;
    let newThumbnailUrl = existingMeetup.thumbnail_url;

    if (thumbnailFile && thumbnailFile.size > 0) {
      const fileExt = thumbnailFile.type.split("/")[1];
      const thumbnailPath = `${meetupId}/thumbnail/${uuidv4()}.${fileExt}`;
      newThumbnailUrl = await uploadAndGetUrl(
        adminClient,
        "meetups",
        thumbnailPath,
        thumbnailFile
      );

      // Optional: Delete old thumbnail if it exists
      if (existingMeetup.thumbnail_url) {
        const oldThumbnailPath =
          existingMeetup.thumbnail_url.split("/meetups/")[1];
        await adminClient.storage.from("meetups").remove([oldThumbnailPath]);
      }
    }

    const descriptionImageFiles = formData.getAll(
      "descriptionImageFiles"
    ) as File[];
    const descriptionJSON = formData.get("description") as string;
    let descriptionContent = JSON.parse(descriptionJSON);

    if (descriptionImageFiles.length > 0) {
      const uploadPromises = descriptionImageFiles.map(async (file, index) => {
        if (file.size === 0) return null;
        const blobUrl = formData.get(
          `descriptionImageBlobUrl_${index}`
        ) as string;
        const fileExt = getFileExtension(file.type);
        const descriptionPath = `${meetupId}/description/${uuidv4()}.${fileExt}`;
        const publicUrl = await uploadAndGetUrl(
          adminClient,
          "meetups",
          descriptionPath,
          file
        );
        return { blobUrl, publicUrl };
      });

      const uploadedImages = (await Promise.all(uploadPromises)).filter(
        Boolean
      ) as { blobUrl: string; publicUrl: string }[];
      let descriptionString = JSON.stringify(descriptionContent);
      uploadedImages.forEach(({ blobUrl, publicUrl }) => {
        if (blobUrl && publicUrl) {
          descriptionString = descriptionString.replace(
            new RegExp(blobUrl, "g"),
            publicUrl
          );
        }
      });
      descriptionContent = JSON.parse(descriptionString);
    }

    const updateData = {
      title: formData.get("title") as string,
      description: descriptionContent,
      thumbnail_url: newThumbnailUrl,
      category: formData.get("category") as Enums<"meetup_category_enum">,
      location_type: formData.get(
        "locationType"
      ) as Enums<"meetup_location_type_enum">,
      status: formData.get("status") as Enums<"meetup_status_enum">,
      start_datetime: (formData.get("startDatetime") as string) || null,
      end_datetime: (formData.get("endDatetime") as string) || null,
      location: formData.get("location") as string,
      address: formData.get("address") as string,
      max_participants:
        parseInt(formData.get("maxParticipants") as string, 10) || null,
      fee: parseInt(formData.get("fee") as string, 10) || null,
    };

    const { error: updateError } = await supabase
      .from("meetups")
      .update(updateData)
      .eq("id", meetupId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath("/meetup");
    revalidatePath(`/meetup/${meetupId}`);
    const clubId = formData.get("clubId") as string | null;
    if (clubId) revalidatePath(`/club/${clubId}`);
  } catch (e) {
    console.error("Update meetup error:", (e as Error).message);
    return { error: (e as Error).message };
  }

  redirect(`/meetup/${meetupId}`);
}

export async function joinMeetup(meetupId: string) {
  console.log("Attempting to join meetup with ID:", meetupId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not found" };
  }

  // 1. 모임 정보 가져오기
  const { data: meetup, error: meetupError } = (await supabase
    .from("meetups")
    .select("organizer_id, max_participants, meetup_participants(*)")
    .eq("id", meetupId)
    .single()) as {
    data: MeetupWithParticipants | null;
    error: PostgrestError | null;
  };

  if (meetupError || !meetup) {
    console.error("Error fetching meetup:", meetupError);
    return { error: "모임 정보를 찾을 수 없습니다." };
  }

  // 2. 모임장인지 확인
  if (meetup.organizer_id === user.id) {
    return { error: "모임장은 자신의 모임에 참가할 수 없습니다." };
  }

  // 3. 이미 참가자인지 확인
  const { data: existingParticipant } = await supabase
    .from("meetup_participants")
    .select("id")
    .eq("meetup_id", meetupId)
    .eq("user_id", user.id)
    .single();

  if (existingParticipant) {
    return { error: "이미 모임에 참가하셨습니다." };
  }

  // 4. 정원 확인
  const currentParticipants = meetup.meetup_participants?.length || 0;
  if (
    meetup.max_participants &&
    currentParticipants >= meetup.max_participants
  ) {
    return { error: "모임 정원이 가득 찼습니다." };
  }

  // 5. 참가자 추가
  const { error } = await supabase.from("meetup_participants").insert({
    meetup_id: meetupId,
    user_id: user.id,
    status: MEETUP_PARTICIPANT_STATUSES.PENDING,
  });

  if (error) {
    console.error("Error inserting participant:", error);
    return { error: "모임 참가에 실패했습니다. 다시 시도해주세요." };
  }

  revalidatePath(`/meetup/${meetupId}`);
  return { success: true };
}

export async function approveMeetupParticipant(
  meetupId: string,
  userId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not found" };
  }

  // Verify that the current user is the organizer of the meetup
  const { data: meetup, error: meetupError } = await supabase
    .from("meetups")
    .select("organizer_id")
    .eq("id", meetupId)
    .single();

  if (meetupError || !meetup) {
    console.error("Error fetching meetup for approval:", meetupError);
    return { error: "모임 정보를 찾을 수 없습니다." };
  }

  if (meetup.organizer_id !== user.id) {
    return { error: "모임장만 참가자를 승인할 수 있습니다." };
  }

  // Update the participant's status to 'approved'
  const { error } = await supabase
    .from("meetup_participants")
    .update({ status: MEETUP_PARTICIPANT_STATUSES.APPROVED })
    .eq("meetup_id", meetupId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error approving participant:", error);
    return { error: "참가자 승인에 실패했습니다. 다시 시도해주세요." };
  }

  revalidatePath(`/meetup/${meetupId}`);
  return { success: true };
}

export async function updateMeetupParticipantStatus(
  meetupId: string,
  userId: string,
  newStatus: Enums<"meetup_participant_status_enum">
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // Verify that the current user is the organizer of the meetup
  const { data: meetup, error: meetupError } = await supabase
    .from("meetups")
    .select("organizer_id")
    .eq("id", meetupId)
    .single();

  if (meetupError || !meetup) {
    console.error("Error fetching meetup for status update:", meetupError);
    return { error: "모임 정보를 찾을 수 없습니다." };
  }

  if (meetup.organizer_id !== user.id) {
    return { error: "모임장만 참가자 상태를 변경할 수 있습니다." };
  }

  // Update the participant\'s status
  const { error } = await supabase
    .from("meetup_participants")
    .update({ status: newStatus })
    .eq("meetup_id", meetupId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating participant status:", error);
    return { error: "참가자 상태 변경에 실패했습니다. 다시 시도해주세요." };
  }

  revalidatePath(`/meetup/${meetupId}`);
  return { success: true };
}
