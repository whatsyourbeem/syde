import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

import { CLUB_MEMBER_ROLES, CLUB_PERMISSION_LEVELS } from "@/lib/constants";
import ClubPostDetailClient from "@/components/club/club-post-detail-client"; // New import

import { Metadata, ResolvingMetadata } from "next";
import { getInitialHtmlFromTiptap } from "@/components/common/tiptap-server-extensions";

interface ClubPostDetailPageProps {
  params: Promise<{
    club_id: string;
    post_id: string;
  }>;
}

export async function generateMetadata(
  { params }: ClubPostDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { club_id, post_id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("club_forum_posts")
    .select("title, content, club_forums(read_permission)")
    .eq("id", post_id)
    .single();

  if (!post) {
    return { title: "Post Not Found - SYDE" };
  }

  const isPublic = post.club_forums?.read_permission === CLUB_PERMISSION_LEVELS.PUBLIC;

  const title = isPublic ? `${post.title} - SYDE 클럽 게시글` : "SYDE 클럽 게시글";

  let plainText = "";
  if (isPublic) {
    let contentObj = post.content;
    if (typeof contentObj === "string") {
      try {
        contentObj = JSON.parse(contentObj);
      } catch (e) {
        // ignore
      }
    }

    if (contentObj && typeof contentObj === "object") {
      try {
        const extractText = (node: any): string => {
          if (node.type === "text" && node.text) return node.text;
          if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractText).join(" ");
          }
          return "";
        };
        plainText = extractText(contentObj).trim();
      } catch (e) {
        // ignore
      }
    } else if (typeof contentObj === "string") {
      plainText = contentObj;
    }
  }

  const description = isPublic ?
    (plainText.length > 160 ? plainText.slice(0, 160) + "..." : (plainText || "SYDE 클럽 게시글"))
    : "SYDE 클럽 멤버들을 위한 게시글입니다.";

  return {
    title,
    description,
    alternates: {
      canonical: `/club/${club_id}/post/${post_id}`,
    },
    openGraph: {
      title,
      description,
      images: ["/we-are-syders.png"],
      type: "article",
      url: `/club/${club_id}/post/${post_id}`,
    },
  };
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
      "*, profiles(id, username, avatar_url, full_name, tagline, bio, link, updated_at, certified), club_forums(read_permission)"
    )
    .eq("id", post_id)
    .single();

  if (error || !post) {
    return redirect(`/club/${club_id}/access-denied`);
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

  // Check if forum is public - anyone can read public posts
  if (forumReadPermission === CLUB_PERMISSION_LEVELS.PUBLIC) {
    isAuthorized = true;
  } else if (user) {
    const isClubOwner = club.owner_id === user.id;
    if (isClubOwner) {
      isAuthorized = true;
    } else if (memberRole) {
      if (
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

  let initialHtml = getInitialHtmlFromTiptap(post.content);

  return (
    <ClubPostDetailClient
      post={postForClient}
      initialHtml={initialHtml}
      clubId={club_id}
      user={user}
      isAuthorized={isAuthorized}
      clubOwnerId={club.owner_id}
    />
  );
}
