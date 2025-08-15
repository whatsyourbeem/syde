import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ClubDetailClient from "@/components/club/club-detail-client";

type ClubDetailPageProps = {
  params: Promise<{
    club_id: string;
  }>;
};

export default async function ClubDetailPage({ params }: ClubDetailPageProps) {
  const { club_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch club details along with owner's profile
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select(`
      *,
      owner_profile:profiles!clubs_owner_id_fkey(*)
    `)
    .eq("id", club_id)
    .single();

  if (clubError || !club) {
    notFound();
  }

  // Fetch club members with their profiles
  const { data: members, error: membersError } = await supabase
    .from("club_members")
    .select(`
      *,
      profiles(*)
    `)
    .eq("club_id", club_id);

  // Fetch meetups associated with the club
  const { data: meetups, error: meetupsError } = await supabase
    .from("meetups")
    .select("*, organizer_profile:profiles!meetups_organizer_id_fkey(*)")
    .eq("club_id", club_id)
    .order("start_datetime", { ascending: false });

  if (membersError || meetupsError) {
    // Handle errors appropriately
    console.error(membersError || meetupsError);
    // Potentially show an error page
    notFound();
  }

  // Check if the current user is a member
  const isMember = user ? members?.some(member => member.profiles?.id === user.id) || false : false;

  const fullClubData = {
    ...club,
    members: members || [],
    meetups: meetups || [],
  };

  return <ClubDetailClient club={fullClubData} isMember={isMember} currentUserId={user?.id} />;
}
