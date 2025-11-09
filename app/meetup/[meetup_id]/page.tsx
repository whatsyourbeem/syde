import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Database } from "@/types/database.types";
import MeetupDetailClient from "@/components/meetup/meetup-detail-client";

type Meetup = Database["public"]["Tables"]["meetups"]["Row"] & {
  clubs: Database["public"]["Tables"]["clubs"]["Row"] | null;
  organizer_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  meetup_participants: (Database["public"]["Tables"]["meetup_participants"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  })[];
};

// 타입 명시
interface PageProps {
  params: Promise<{ meetup_id: string }>;
}

export default async function MeetupDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { meetup_id } = await params;

  const { data: meetup, error } = await supabase
    .from("meetups")
    .select(
      "*, clubs(*), organizer_profile:profiles!meetups_organizer_id_fkey(full_name, username, avatar_url, certified), meetup_participants(*, profiles(id, full_name, username, avatar_url, tagline, certified)), status, start_datetime, end_datetime, location, address, max_participants, fee"
    )
    .eq("id", meetup_id)
    .single();

  if (error || !meetup) {
    console.error("Error fetching meetup details:", error);
    notFound();
  }

  // description JSON 파싱 개선
  if (typeof meetup.description === "string") {
    try {
      meetup.description = JSON.parse(meetup.description);
    } catch (e) {
      console.error("Failed to parse meetup description JSON:", e);
      meetup.description = null;
    }
  }

  // 사용자 정보 및 클럽 가입 여부 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOrganizer = user?.id === meetup.organizer_id;

  let joinedClubIds: string[] = [];
  if (user) {
    const { data: joinedClubsData } = await supabase
      .from("club_members")
      .select("club_id")
      .eq("user_id", user.id);

    if (joinedClubsData) {
      joinedClubIds = joinedClubsData.map((item) => item.club_id);
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
