import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Tables } from "@/types/database.types";
import MeetupCard from "@/components/meetup/meetup-card";

type Profile = Tables<"profiles">;
type Meetup = Tables<"meetups"> & {
  organizer_profile: Profile | null;
  clubs: Tables<"clubs"> | null;
};

type ClubMeetupListPageProps = {
  params: Promise<{
    club_id: string;
  }>;
};

export default async function ClubMeetupListPage({
  params,
}: ClubMeetupListPageProps) {
  const supabase = await createClient();
  const { club_id } = await params;

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("name")
    .eq("id", club_id)
    .single();

  const { data: meetups, error: meetupsError } = await supabase
    .from("meetups")
    .select(
      "id, created_at, organizer_id, club_id, title, description, thumbnail_url, status, start_datetime, end_datetime, location, address, max_participants, fee, organizer_profile:profiles!meetups_organizer_id_fkey(*), clubs(*)"
    )
    .eq("club_id", club_id)
    .order("start_datetime", { ascending: false });

  if (clubError || !club) {
    notFound();
  }

  if (meetupsError) {
    console.error("Error fetching meetups:", meetupsError);
    // Optionally, you can render an error message to the user
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6">
        &apos;{club.name}&apos; 클럽 모임
      </h1>
      {meetups && meetups.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(meetups as Meetup[]).map((meetup) => (
            <MeetupCard meetup={meetup} key={meetup.id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>이 클럽에서 주최하는 모임이 아직 없습니다.</p>
        </div>
      )}
    </div>
  );
}
