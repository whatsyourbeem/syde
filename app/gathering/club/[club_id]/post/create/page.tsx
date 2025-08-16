import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ClubPostForm from "@/components/club/club-post-form";


interface ClubPostCreatePageProps {
  params: Promise<{
    club_id: string;
  }>;
}

export default async function ClubPostCreatePage({ params }: ClubPostCreatePageProps) {
  const { club_id } = await params;
  const supabase = await createClient();

  // Fetch the first forum for the club
  const { data: forum, error: forumError } = await supabase
    .from("club_forums")
    .select("*")
    .eq("club_id", club_id)
    .limit(1)
    .single();

  if (forumError || !forum) {
    // If no forum exists for the club, or an error occurred, show notFound
    console.error("Error fetching forum for club:", forumError);
    notFound();
  }

  // Check if the user is a member with LEADER or FULL_MEMBER role
  const { data: { user } } = await supabase.auth.getUser();
  let canCreatePost = false;
  if (user) {
    const { data: member, error: memberError } = await supabase
      .from("club_members")
      .select("role")
      .eq("club_id", club_id)
      .eq("user_id", user.id)
      .single();

    if (!memberError && member && (member.role === 'LEADER' || member.role === 'FULL_MEMBER')) {
      canCreatePost = true;
    }
  }

  if (!canCreatePost) {
    // Redirect or show an error if user is not authorized
    // For now, just show a message or notFound
    notFound(); // Or redirect to login/club page with a message
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">새 게시글 작성</h1>
      <ClubPostForm forumId={forum.id} clubId={club_id} />
    </div>
  );
}
