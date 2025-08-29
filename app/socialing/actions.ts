"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Enums } from "@/types/database.types";

export async function updateMeetup(formData: FormData) {
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const thumbnailUrl = formData.get("thumbnailUrl") as string;
  const category = formData.get("category") as string;
  const locationType = formData.get("locationType") as string;
  const status = formData.get("status") as string;
  const startDatetime = formData.get("startDatetime") as string;
  const endDatetime = formData.get("endDatetime") as string;
  const locationDescription = formData.get("locationDescription") as string;
  const maxParticipants = formData.get("maxParticipants") as string;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login"); // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  }

  const { error } = await supabase
    .from("meetups")
    .update({
      title,
      description: description || null,
      thumbnail_url: thumbnailUrl || null,
      category: category as Enums<'meetup_category_enum'>,
      location_type: locationType as Enums<'meetup_location_type_enum'>,
      status: status as Enums<'meetup_status_enum'>,
      start_datetime: startDatetime || null,
      end_datetime: endDatetime || null,
      location_description: locationDescription || null,
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
    })
    .eq("id", id)
    .eq("organizer_id", user.id); // 모임장만 수정 가능하도록

  if (error) {
    console.error("Error updating meetup:", error);
    return { error: error.message };
  }

  revalidatePath(`/socialing/meetup/${id}`);
  revalidatePath("/socialing");
  return { error: null };
}

export async function uploadMeetupThumbnail(formData: FormData) {
  const file = formData.get("file") as File;
  const meetupId = formData.get("meetupId") as string;

  if (!file) {
    return { error: "파일이 없습니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증되지 않은 사용자입니다." };
  }

  const fileName = `${meetupId}/${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from("meetup-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error uploading thumbnail:", error);
    return { error: error.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from("meetup-images")
    .getPublicUrl(fileName);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    return { error: "공개 URL을 가져올 수 없습니다." };
  }

  return { publicUrl: publicUrlData.publicUrl };
}

export async function uploadMeetupDescriptionImage(formData: FormData) {
  const file = formData.get("file") as File;
  const meetupId = formData.get("meetupId") as string; // Keep meetupId for organization

  if (!file) {
    return { error: "파일이 없습니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증되지 않은 사용자입니다." };
  }

  // Use a more generic path for description images, organized by meetup
  const fileName = `${meetupId}/${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from("meetup-images") // A new bucket for description images
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error uploading description image:", error);
    return { error: error.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from("meetup-images")
    .getPublicUrl(fileName);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    return { error: "공개 URL을 가져올 수 없습니다." };
  }

  return { publicUrl: publicUrlData.publicUrl };
}

export async function createMeetup(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const id = formData.get("id") as string;
  const clubId = formData.get("clubId") as string | null;
  const maxParticipants = formData.get("maxParticipants") as string;

  const meetupData = {
    id: id,
    organizer_id: user.id,
    club_id: clubId,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    thumbnail_url: formData.get("thumbnailUrl") as string,
    category: formData.get("category") as Enums<"meetup_category_enum">,
    location_type: formData.get("locationType") as Enums<"meetup_location_type_enum">,
    status: formData.get("status") as Enums<"meetup_status_enum">,
    start_datetime: (formData.get("startDatetime") as string) || null,
    end_datetime: (formData.get("endDatetime") as string) || null,
    location_description: formData.get("locationDescription") as string,
    max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
  };

  const { data: newMeetup, error } = await supabase.from("meetups").insert(meetupData).select('id').single();

  if (error || !newMeetup) {
    console.error("Error creating meetup:", error);
    return { error: error.message };
  }

  // 모임 생성자를 참가자로 자동 추가
  const { error: participantError } = await supabase
    .from('meetup_participants')
    .insert({ meetup_id: newMeetup.id, user_id: user.id });

  if (participantError) {
    console.error('Error adding organizer as participant:', participantError);
    // 이 에러는 모임 생성 자체를 막지는 않지만, 로깅은 필요
  }

  revalidatePath("/socialing");
  if (clubId) {
    revalidatePath(`/socialing/club/${clubId}`);
  }
  
  return { error: null };
}
