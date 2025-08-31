import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Database } from "@/types/database.types";
import MeetupDetailClient from "@/components/meetup/meetup-detail-client"; // Import MeetupDetailClient

type Meetup = Database["public"]["Tables"]["meetups"]["Row"] & {
  clubs: Database["public"]["Tables"]["clubs"]["Row"] | null;
  organizer_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  meetup_participants: (Database["public"]["Tables"]["meetup_participants"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  })[];
};

export default async function MeetupDetailPage({ params }: { params: Promise<{ meetup_id: string }> }) {
  const supabase = await createClient();

  const { meetup_id } = await params;

  const { data: meetup, error } = await supabase
    .from("meetups")
    .select(
      "*, clubs(*), organizer_profile:profiles!meetups_organizer_id_fkey(full_name, username, avatar_url), meetup_participants(*, profiles(id, full_name, username, avatar_url, tagline)), category, location_type, status, start_datetime, end_datetime, location_description, max_participants"
    )
    .eq("id", meetup_id)
    .single();

  if (error || !meetup) {
    console.error("Error fetching meetup details:", error);
    notFound();
  }

  // Ensure description is parsed as JSON if it's a string
  if (typeof meetup.description === 'string') {
    try {
      meetup.description = JSON.parse(meetup.description);
    } catch (e) {
      console.error("Failed to parse meetup description JSON:", e);
      // Fallback to null or handle error as appropriate
      meetup.description = null;
    }
  }

  // Fetch user and joinedClubIds here, as MeetupDetailClient needs them
  const { data: { user } } = await supabase.auth.getUser();
  const isOrganizer = user?.id === meetup.organizer_id;

  let joinedClubIds: string[] = [];
  if (user) {
    const { data: joinedClubsData } = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id);

    if (joinedClubsData) {
      joinedClubIds = joinedClubsData.map(item => item.club_id);
    }
  }

  return (
    <MeetupDetailClient
      meetup={meetup as Meetup}
      isOrganizer={isOrganizer}
      user={user}
      joinedClubIds={joinedClubIds}
    />
  );
}
