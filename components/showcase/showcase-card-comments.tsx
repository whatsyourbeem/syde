"use client";

import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";

interface ShowcaseCardCommentsProps {
  showcaseId: string;
  currentUserId: string | null;
  showComments: boolean;
  onCommentAdded: () => void;
}

export function ShowcaseCardComments({ 
  showcaseId, 
  currentUserId, 
  showComments, 
  onCommentAdded 
}: ShowcaseCardCommentsProps) {
  if (!showComments) return null;

  return (
    <div className="mt-4 border-t">
      <CommentList showcaseId={showcaseId} currentUserId={currentUserId} />
      <CommentForm
        showcaseId={showcaseId}
        currentUserId={currentUserId}
        onCommentAdded={onCommentAdded}
      />
    </div>
  );
}