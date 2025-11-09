import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ReservForm from "@/components/meetup/reserv/reserv-form";
import { createMeetupParticipant } from "@/app/meetup/reserv-actions";

interface Props {
  params: Promise<{ meetup_id: string }>;
}

export default async function MeetupReservPage({ params }: Props) {
  const supabase = await createClient();
  const { meetup_id: meetupId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/meetup/${meetupId}/reserv`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const initialName = profile?.full_name || "";

  const { data: meetup } = await supabase
    .from("meetups")
    .select("id, fee")
    .eq("id", meetupId)
    .single();

  if (!meetup) {
    notFound();
  }

  const boundServerAction = createMeetupParticipant.bind(null, meetupId);

  return (
    <ReservForm
      meetup={meetup}
      initialName={initialName}
      serverAction={boundServerAction}
    />
  );
}
