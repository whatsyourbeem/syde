import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClubPostForm from "@/components/club/club-post-form";

interface ClubPostCreatePageProps {
  params: Promise<{
    club_id: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ClubPostCreatePage({ params, searchParams }: ClubPostCreatePageProps) {
  const { club_id } = await params;
  const awaitedSearchParams = await searchParams;
  const forumIdFromQuery = awaitedSearchParams?.forum_id as string | undefined;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/socialing/club/${club_id}?error=not_logged_in`);
  }

  // Fetch all forums for the club, including write permissions
  const { data: forums, error: forumsError } = await supabase
    .from("club_forums")
    .select("*, write_permission")
    .eq("club_id", club_id)
    .order("position", { ascending: true });

  if (forumsError || !forums) {
    console.error("Error fetching forums:", forumsError);
    redirect(`/socialing/club/${club_id}?error=forums_not_found`);
  }

  // Check if the current user is a member and get their role
  const { data: members } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club_id)
    .eq("user_id", user.id)
    .single();

  const currentUserMembership = members;
  const isMember = !!currentUserMembership;
  const userRole = currentUserMembership?.role || null;

  // Fetch club owner to determine isOwner
  const { data: clubData } = await supabase
    .from("clubs")
    .select("owner_id")
    .eq("id", club_id)
    .single();

  const actualIsOwner = user.id === clubData?.owner_id;

  if (!isMember) {
    redirect(`/socialing/club/${club_id}?error=not_a_member`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">새 게시글 작성</h1>
      <ClubPostForm clubId={club_id} forums={forums} userRole={userRole} isOwner={actualIsOwner} initialForumId={forumIdFromQuery} />
    </div>
  );
}
