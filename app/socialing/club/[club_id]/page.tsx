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
    .select("*, organizer_profile:profiles!meetups_organizer_id_fkey(*)")
    .eq("club_id", club_id)
    .order("start_datetime", { ascending: false });

  // Fetch all forums for the club
  const { data: forums, error: forumsError } = await supabase
    .from("club_forums")
    .select("*, write_permission") // Fetch write_permission
    .eq("club_id", club_id)
    .order("position", { ascending: true });

  if (forumsError) {
    console.error("Error fetching forums:", forumsError);
    notFound();
  }

  // For each forum, fetch its posts
  const forumsWithPosts: ForumWithPosts[] = forums ? await Promise.all(
    forums.map(async (forum) => {
      const { data: postsData, error: postsError } = await supabase
        .from("club_forum_posts")
        .select("*, author:profiles(*)")
        .eq("forum_id", forum.id)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error(`Error fetching posts for forum ${forum.id}:`, postsError);
        return { ...forum, posts: [] }; // Return forum with empty posts on error
      }
      
      const posts = postsData?.map(p => ({ ...p, author: p.author as Profile | null })) || [];
      return { ...forum, posts };
    })
  ) : [];

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
    forums: forumsWithPosts,
  };

  return <ClubDetailClient club={fullClubData} isMember={isMember} currentUserId={user?.id} userRole={userRole} isOwner={isOwner} />;
}
