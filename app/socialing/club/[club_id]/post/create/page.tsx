import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClubPostForm from "@/components/club/club-post-form";
import { CLUB_MEMBER_ROLES, CLUB_PERMISSION_LEVELS } from "@/lib/constants";

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

  let forum;
  let forumError;

  if (forumIdFromQuery) {
    // Fetch the specific forum using forumId from query params
    const { data, error } = await supabase
      .from("club_forums")
      .select("*")
      .eq("id", forumIdFromQuery)
      .eq("club_id", club_id) // Ensure forum belongs to this club
      .single();
    forum = data;
    forumError = error;
  } else {
    // If no forum_id is provided, fetch the first forum (fallback or error)
    // This case should ideally not happen if the button always passes forum_id
    const { data, error } = await supabase
      .from("club_forums")
      .select("*")
      .eq("club_id", club_id)
      .order("position", { ascending: true })
      .limit(1)
      .single();
    forum = data;
    forumError = error;
  }

  if (forumError || !forum) {
    console.error("Error fetching forum or forum not found:", forumError);
    // Redirect to club page with an error message or show notFound
    redirect(`/socialing/club/${club_id}?error=forum_not_found`);
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

    if (!memberError && member && (member.role === CLUB_MEMBER_ROLES.LEADER || member.role === CLUB_MEMBER_ROLES.FULL_MEMBER || member.role === CLUB_MEMBER_ROLES.GENERAL_MEMBER)) {
      // Also check write permission of the specific forum
      const { data: forumPermissions, error: permError } = await supabase
        .from("club_forums")
        .select("write_permission")
        .eq("id", forum.id)
        .single();

      if (!permError && forumPermissions) {
        const writePermission = forumPermissions.write_permission;
        if (writePermission === CLUB_PERMISSION_LEVELS.MEMBER && (member.role === CLUB_MEMBER_ROLES.GENERAL_MEMBER || member.role === CLUB_MEMBER_ROLES.FULL_MEMBER || member.role === CLUB_MEMBER_ROLES.LEADER)) {
          canCreatePost = true;
        } else if (writePermission === CLUB_PERMISSION_LEVELS.FULL_MEMBER && (member.role === CLUB_MEMBER_ROLES.FULL_MEMBER || member.role === CLUB_MEMBER_ROLES.LEADER)) {
          canCreatePost = true;
        } else if (writePermission === CLUB_PERMISSION_LEVELS.LEADER && member.role === CLUB_MEMBER_ROLES.LEADER) {
          canCreatePost = true;
        }
      }
    }
  }

  if (!canCreatePost) {
    redirect(`/socialing/club/${club_id}?error=unauthorized_to_post`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">새 게시글 작성</h1>
      <ClubPostForm forumId={forum.id} clubId={club_id} />
    </div>
  );
}
