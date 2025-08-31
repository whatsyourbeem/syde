"use client";

import { useState } from "react";
import { Tables, Enums } from "@/types/database.types";
import TiptapViewer from "@/components/common/tiptap-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import ClubPostForm from "@/components/club/club-post-form"; // ClubPostForm is a default export
import { ClubPostDetailHeader } from "@/components/club/club-post-detail-header"; // Keep this for the header
import { CLUB_PERMISSION_LEVEL_DISPLAY_NAMES, CLUB_PERMISSION_LEVELS } from "@/lib/constants"; // Added import
import { ClubPostCommentForm } from "@/components/club/comment/club-post-comment-form";
import { ClubPostCommentList } from "@/components/club/comment/club-post-comment-list";
import { Separator } from "@/components/ui/separator";

type Profile = Tables<"profiles">;
// Define a more specific type for the author profile fetched in the post detail
type PostAuthorProfile = Pick<Profile, "username" | "avatar_url" | "full_name">;
type ClubForumPost = Tables<"club_forum_posts"> & {
  author: PostAuthorProfile | null;
  club_forums?: { read_permission: Enums<"club_permission_level_enum"> } | null; // Added back
};
import { User } from "@supabase/supabase-js"; // Import User type from Supabase auth

interface ClubPostDetailClientProps {
  post: ClubForumPost;
  clubId: string;
  user: User | null;
  isAuthorized: boolean;
  clubOwnerId: string;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

export default function ClubPostDetailClient({
  post,
  clubId,
  user,
  isAuthorized,
  clubOwnerId,
}: ClubPostDetailClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditSuccess = () => {
    setIsEditing(false);
    // Optionally, revalidate path or refresh data if needed
    // router.refresh(); // If using Next.js router
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-3xl">
      <ClubPostDetailHeader
        post={post}
        clubId={clubId}
        clubOwnerId={clubOwnerId}
        user={user}
        onEditClick={() => setIsEditing(true)} // Pass the function
      />

      {isEditing ? (
        <ClubPostForm
          clubId={clubId}
          initialData={{ title: post.title, content: post.content, forumId: post.forum_id, postId: post.id }} // Added forumId and postId to initialData
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
            <Avatar className="size-8">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback>{post.author?.username?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="font-semibold">
              {post.author?.full_name || post.author?.username || "Unknown User"}
            </span>
            <span className="text-xs">•</span>
            <span className="text-xs">{formatDate(post.created_at)}</span>
          </div>

          <Separator className="my-4" />

          <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
            {isAuthorized ? (
              post.content && <TiptapViewer content={post.content} />
            ) : (
              <div className="p-8 text-center bg-secondary rounded-lg">
                <p className="text-secondary-foreground">
                  {(() => {
                    const permissionLevel = post.club_forums?.read_permission || CLUB_PERMISSION_LEVELS.PUBLIC;
                    return `이 게시글은 ${CLUB_PERMISSION_LEVEL_DISPLAY_NAMES[permissionLevel as Enums<"club_permission_level_enum">]}만 볼 수 있습니다.`;
                  })()}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {isAuthorized && !isEditing && ( // Only show comments if authorized and not editing
        <div className="mt-8 border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">댓글</h2>
          <ClubPostCommentForm
            postId={post.id}
            currentUserId={user?.id || null}
          />
          <ClubPostCommentList
            postId={post.id}
            currentUserId={user?.id || null}
          />
        </div>
      )}
    </div>
  );
}
