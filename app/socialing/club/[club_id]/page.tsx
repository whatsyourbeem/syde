import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ClubDetailClient from "@/components/club/club-detail-client";
import { Tables } from "@/types/database.types";

type Profile = Tables<'profiles'>;
type ClubForumPost = Tables<'club_forum_posts'> & { author: Profile | null };
type ForumWithPosts = Tables<'club_forums'> & { posts: ClubForumPost[] };

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
    .select("id, created_at, organizer_id, club_id, title, description, thumbnail_url, category, location_type, status, start_datetime, end_datetime, location, address, max_participants, fee, organizer_profile:profiles!meetups_organizer_id_fkey(*)")
    .eq("club_id", club_id)
    .order("start_datetime", { ascending: false });

  // Fetch all forums with their posts in a single query using nested selection
  const { data: forumsWithPosts, error: forumsError } = await supabase
    .from("club_forums")
    .select(`
      *,
      write_permission,
      club_forum_posts(
        *,
        author:profiles(*)
      )
    `)
    .eq("club_id", club_id)
    .order("position", { ascending: true });

  if (forumsError) {
    console.error("Error fetching forums with posts:", forumsError);
    notFound();
  }

  // Transform the data to match the expected structure
  const transformedForums: ForumWithPosts[] = forumsWithPosts?.map(forum => ({
    ...forum,
    posts: (forum.club_forum_posts || [])
      .map(post => ({
        ...post,
        author: post.author as Profile | null
      }))
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
  })) || [];

  if (membersError || meetupsError) {
    // Handle errors appropriately
    console.error(membersError || meetupsError);
    // Potentially show an error page
    notFound();
  }

  // Check if the current user is a member and get their role
  const currentUserMembership = user ? members?.find(member => member.profiles?.id === user.id) : undefined;
  const isMember = !!currentUserMembership;
  const userRole = currentUserMembership?.role || null;
  const isOwner = user?.id === club.owner_id;

  const fullClubData = {
    ...club,
    members: members || [],
    meetups: meetups || [],
    forums: transformedForums,
  };

  return <ClubDetailClient club={fullClubData} isMember={isMember} currentUserId={user?.id} userRole={userRole} isOwner={isOwner} />;
}
