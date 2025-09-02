import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import { CLUB_MEMBER_ROLES, CLUB_PERMISSION_LEVELS } from "@/lib/constants";
import ClubPostDetailClient from "@/components/club/club-post-detail-client"; // New import

interface ClubPostDetailPageProps {
  params: Promise<{
    club_id: string;
    post_id: string;
  }>;
}

export default async function ClubPostDetailPage({
  params,
}: ClubPostDetailPageProps) {
  const supabase = await createClient();
  const { club_id, post_id } = await params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from("club_forum_posts")
    .select(
      "*, profiles(id, username, avatar_url, full_name, tagline), club_forums(read_permission)"
    )
    .eq("id", post_id)
    .single();

  if (error || !post) {
    console.error("Error fetching post:", error);
    notFound();
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("owner_id")
    .eq("id", club_id)
    .single();

  if (!club) {
    notFound();
  }

  let memberRole = null;
  if (user) {
    const { data: member } = await supabase
      .from("club_members")
      .select("role")
      .eq("club_id", club_id)
      .eq("user_id", user.id)
      .single();
    if (member) {
      memberRole = member.role;
    }
  }

  const forumReadPermission = post.club_forums?.read_permission;

  let isAuthorized = false;
  if (user) {
    const isClubOwner = club.owner_id === user.id;
    if (isClubOwner) {
      isAuthorized = true;
    } else if (memberRole) {
      if (forumReadPermission === CLUB_PERMISSION_LEVELS.PUBLIC) {
        isAuthorized = true;
      } else if (
        forumReadPermission === CLUB_PERMISSION_LEVELS.MEMBER &&
        (memberRole === CLUB_MEMBER_ROLES.GENERAL_MEMBER ||
          memberRole === CLUB_MEMBER_ROLES.FULL_MEMBER ||
          memberRole === CLUB_MEMBER_ROLES.LEADER)
      ) {
        isAuthorized = true;
      } else if (
        forumReadPermission === CLUB_PERMISSION_LEVELS.FULL_MEMBER &&
        (memberRole === CLUB_MEMBER_ROLES.FULL_MEMBER ||
          memberRole === CLUB_MEMBER_ROLES.LEADER)
      ) {
        isAuthorized = true;
      } else if (
        forumReadPermission === CLUB_PERMISSION_LEVELS.LEADER &&
        memberRole === CLUB_MEMBER_ROLES.LEADER
      ) {
        isAuthorized = true;
      }
    }
  }

  const postForClient = {
    ...post,
    author: post.profiles, // Map profiles to author
  };

  return (
    <ClubPostDetailClient
      post={postForClient}
      clubId={club_id}
      user={user}
      isAuthorized={isAuthorized}
      clubOwnerId={club.owner_id}
    />
  );
}
