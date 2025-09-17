"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tables, Enums } from "@/types/database.types";
import TiptapViewer from "@/components/common/tiptap-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import ClubPostForm from "@/components/club/club-post-form"; // ClubPostForm is a default export
import { ClubPostDetailHeader } from "@/components/club/club-post-detail-header"; // Keep this for the header
import { CLUB_PERMISSION_LEVEL_DISPLAY_NAMES, CLUB_PERMISSION_LEVELS } from "@/lib/constants"; // Added import
import { ClubPostCommentForm } from "@/components/club/comment/club-post-comment-form";
import { ClubPostCommentList } from "@/components/club/comment/club-post-comment-list";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime } from "@/lib/utils";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import Link from "next/link";
import { CertifiedBadge } from "@/components/ui/certified-badge";


// Define a more specific type for the author profile fetched in the post detail
type PostAuthorProfile = Tables<"profiles">;
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
  clubOwnerId: string | null;
}

export default function ClubPostDetailClient({
  post,
  clubId,
  user,
  isAuthorized,
  clubOwnerId,
}: ClubPostDetailClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [replyTo, setReplyTo] = useState<{ parentId: string; authorName: string; authorUsername: string | null; authorAvatarUrl: string | null; } | null>(null);
  const queryClient = useQueryClient();
  const formattedPostDate = post.created_at ? formatRelativeTime(post.created_at) : '';

  const handleEditSuccess = () => {
    setIsEditing(false);
    // Optionally, revalidate path or refresh data if needed
    // router.refresh(); // If using Next.js router
  };

  const handleCommentAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["clubPostComments", { postId: post.id }] });
    setReplyTo(null); // Clear replyTo after comment is added
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
          <Link href={`/${post.author?.username || post.author?.id}`} className="block">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
              <ProfileHoverCard userId={post.author?.id || ""} profileData={post.author} disableHover={true}>
                <Avatar className="size-8">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback>{post.author?.username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </ProfileHoverCard>
              <ProfileHoverCard userId={post.author?.id || ""} profileData={post.author} disableHover={true}>
                <div className="flex items-baseline gap-1">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold truncate max-w-48">
                        {post.author?.full_name || post.author?.username || "Unknown User"}
                      </span>
                      {post.author?.certified && <CertifiedBadge size="sm" />}
                    </div>
                    {post.author?.tagline && (
                      <p className="text-xs text-muted-foreground truncate max-w-48">{post.author.tagline}</p>
                    )}
                  </div>
                  <div>
                  <p className="text-xs text-muted-foreground">·&nbsp;&nbsp;{formattedPostDate}</p>
                  </div>
                </div>
              </ProfileHoverCard>
            </div>
          </Link>

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
        <div className="mt-8 border-t pt-4">
          <h2 className="text-xl font-semibold mb-4 ml-2">댓글</h2>
          <ClubPostCommentList
            postId={post.id}
            currentUserId={user?.id || null}
            clubId={clubId}
            isDetailPage={true}
            setReplyTo={setReplyTo}
          />
          <ClubPostCommentForm
            postId={post.id}
            currentUserId={user?.id || null}
            replyTo={replyTo}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      )}
    </div>
  );
}
