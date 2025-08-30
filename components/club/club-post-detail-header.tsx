
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ClubPostActionsDropdown } from "./club-post-actions-dropdown";
import { Database } from "@/types/database.types";
import { User } from "@supabase/supabase-js";

type Post = Database["public"]["Tables"]["club_forum_posts"]["Row"];

interface ClubPostDetailHeaderProps {
  post: Post;
  clubId: string;
  clubOwnerId: string;
  user: User | null;
  onEditClick: () => void; // Added prop
}

export function ClubPostDetailHeader({ post, clubId, clubOwnerId, user, onEditClick }: ClubPostDetailHeaderProps) {
  const router = useRouter();

  const isAuthor = user?.id === post.user_id;
  const isClubOwner = user?.id === clubOwnerId;
  const canManage = isAuthor || isClubOwner;

  return (
    <div className="flex items-center justify-between mb-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ChevronLeft className="h-6 w-6" />
        <span className="sr-only">Back</span>
      </Button>
      
      {canManage && (
        <ClubPostActionsDropdown post={post} clubId={clubId} onEditClick={onEditClick} />
      )}
    </div>
  );
}
