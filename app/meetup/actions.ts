"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
      category: category as any, // ENUM 타입 캐스팅
      location_type: locationType as any, // ENUM 타입 캐스팅
      status: status as any, // ENUM 타입 캐스팅
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

  revalidatePath(`/meetup/${id}`);
  revalidatePath("/meetup");
  redirect(`/meetup/${id}`);
}
