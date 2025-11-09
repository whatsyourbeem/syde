import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ReservForm from "@/components/meetup/reserv/reserv-form";
import { createMeetupParticipant } from "./actions";

export default async function MeetupReservPage({
  params,
}: {
  params: { meetup_id: string };
}) {
  const supabase = await createClient();
  const meetupId = params.meetup_id;

  // 1. Fetch user profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/meetup/" + meetupId + "/reserv");
  }

  let initialName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    initialName = profile?.full_name || "";
  }

  // 2. Fetch meetup details
  const { data: meetup } = await supabase
    .from("meetups")
    .select("id, fee")
    .eq("id", meetupId)
    .single();

  if (!meetup) {
    notFound();
  }

  // 3. Prepare the server action
  const boundServerAction = createMeetupParticipant.bind(null, meetupId);

  // 4. Render the client component with fetched data
  return <ReservForm meetup={meetup} initialName={initialName} serverAction={boundServerAction} />;
}
