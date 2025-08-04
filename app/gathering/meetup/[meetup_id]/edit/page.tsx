import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MeetupEditForm from "@/components/meetup/meetup-edit-form";

export default async function MeetupEditPage({ params }: { params: Promise<{ meetup_id: string }> }) {
  const supabase = await createClient();

  const { meetup_id } = await params;

  const { data: meetup, error } = await supabase
    .from("meetups")
    .select(
      "*, organizer_profile:profiles!meetups_organizer_id_fkey(full_name, username, avatar_url), category, location_type, status, start_datetime, end_datetime, location_description"
    )
    .eq("id", meetup_id)
    .single();

  if (error || !meetup) {
    console.error("Error fetching meetup for edit:", error);
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const isOrganizer = user?.id === meetup.organizer_id;

  if (!isOrganizer) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">모임 수정</h1>
      <MeetupEditForm meetup={meetup} />
    </div>
  );
}
