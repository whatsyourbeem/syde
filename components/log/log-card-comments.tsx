"use client";

import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";

interface LogCardCommentsProps {
  logId: string;
  currentUserId: string | null;
  showComments: boolean;
  onCommentAdded: () => void;
}

export function LogCardComments({ 
  logId, 
  currentUserId, 
  showComments, 
  onCommentAdded 
}: LogCardCommentsProps) {
  if (!showComments) return null;

  return (
    <div className="mt-4 border-t">
      <CommentList logId={logId} currentUserId={currentUserId} />
      <CommentForm
        logId={logId}
        currentUserId={currentUserId}
        onCommentAdded={onCommentAdded}
      />
    </div>
  );
}