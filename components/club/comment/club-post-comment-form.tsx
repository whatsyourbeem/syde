"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { createClubPostComment, updateClubPostComment } from "@/app/socialing/club/actions";
import { useFormStatus } from "react-dom";
import { Database } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface ClubPostCommentFormProps {
  postId: string;
  currentUserId: string | null;
  parentCommentId?: string | null;
  initialCommentData?: Database['public']['Tables']['club_forum_post_comments']['Row'];
  onCommentAdded?: () => void;
  onCommentUpdated?: () => void;
  onCancel?: () => void;
}

function SubmitButton({ initialCommentData, content, isSubmitting }: { initialCommentData?: Database['public']['Tables']['club_forum_post_comments']['Row'], content: string, isSubmitting: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isSubmitting || content.trim() === "";
  return (
    <Button type="submit" disabled={isDisabled}>
      {pending || isSubmitting
        ? initialCommentData ? "수정 중..." : "작성 중..."
        : initialCommentData ? "수정" : "작성"}
    </Button>
  );
}

export function ClubPostCommentForm({
  postId,
  currentUserId,
  parentCommentId,
  initialCommentData,
  onCommentAdded,
  onCommentUpdated,
  onCancel,
}: ClubPostCommentFormProps) {
  const supabase = createClient();
  const { openLoginDialog } = useLoginDialog();
  const formRef = useRef<HTMLFormElement>(null);
  const [content, setContent] = useState(initialCommentData?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mention states
  const [mentionSearchTerm, setMentionSearchTerm] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{ id: string; username: string | null; full_name: string | null; avatar_url: string | null; }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMentionSuggestions = useCallback(async (term: string) => {
    if (term.length < 1) {
      setMentionSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
      .limit(5);

    if (error) {
      console.error("Error fetching mention suggestions:", error);
      setMentionSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setMentionSuggestions(data || []);
    setShowSuggestions(true);
  }, [supabase]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (mentionSearchTerm) {
        fetchMentionSuggestions(mentionSearchTerm);
      } else {
        setShowSuggestions(false);
        setMentionSuggestions([]);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [mentionSearchTerm, fetchMentionSuggestions]);

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    const cursorPosition = e.target.selectionStart;
    if (cursorPosition === null) return;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const mentionRegex = /^[a-zA-Z0-9._\uAC00-\uD7A3-]*$/u;
      if (mentionRegex.test(textAfterAt)) {
        setMentionSearchTerm(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        setActiveSuggestionIndex(0);
      } else {
        setMentionSearchTerm("");
        setShowSuggestions(false);
      }
    } else {
      setMentionSearchTerm("");
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: { id: string; username: string | null; full_name: string | null; avatar_url: string | null; }) => {
    if (mentionStartIndex === -1) return;

    const newContent =
      content.substring(0, mentionStartIndex) +
      `@${suggestion.username} ` +
      content.substring(mentionStartIndex + mentionSearchTerm.length + 1);

    setContent(newContent);
    setMentionSearchTerm("");
    setShowSuggestions(false);
    if (inputRef.current) {
      const newCursorPosition = mentionStartIndex + (suggestion.username?.length || 0) + 2;
      inputRef.current.selectionStart = newCursorPosition;
      inputRef.current.selectionEnd = newCursorPosition;
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prevIndex) =>
          (prevIndex + 1) % mentionSuggestions.length
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prevIndex) =>
          (prevIndex - 1 + mentionSuggestions.length) % mentionSuggestions.length
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectSuggestion(mentionSuggestions[activeSuggestionIndex]);
      }
    }
  };

  const clientAction = async (formData: FormData) => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }

    setIsSubmitting(true);

    // The server action will process mentions
    formData.set("content", content);

    let result;
    if (initialCommentData) {
      const commentId = formData.get("comment_id") as string;
      result = await updateClubPostComment(commentId, content);
    } else {
      const postId = formData.get("post_id") as string;
      const parentCommentId = formData.get("parent_comment_id") as string | null;
      result = await createClubPostComment(postId, content, parentCommentId);
    }

    if (result?.error) {
      alert(`Error: ${result.error}`);
    } else {
      if (initialCommentData) {
        if (onCommentUpdated) onCommentUpdated();
      } else {
        formRef.current?.reset();
        setContent("");
        if (onCommentAdded) onCommentAdded();
      }
    }
    setIsSubmitting(false);
  };

  return (
    <form
      ref={formRef}
      action={clientAction}
      className="flex flex-col gap-2 m-4 relative"
    >
      <input type="hidden" name="post_id" value={postId} />
      {initialCommentData && <input type="hidden" name="comment_id" value={initialCommentData.id} />}
      {parentCommentId && <input type="hidden" name="parent_comment_id" value={parentCommentId} />}
      <div className="flex gap-2">
        <div className="flex-grow relative">
          <Input
            name="content"
            placeholder={initialCommentData ? "댓글을 수정하세요..." : "댓글을 작성하세요..."}
            disabled={!currentUserId || isSubmitting}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            className="w-full pr-20"
            ref={inputRef}
          />
          {showSuggestions && mentionSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
              {mentionSuggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-accent ${index === activeSuggestionIndex ? 'bg-accent' : ''}`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className="flex items-center">
                    {suggestion.avatar_url && (
                      <Image
                        src={suggestion.avatar_url}
                        alt={`${suggestion.username}'s avatar`}
                        width={24}
                        height={24}
                        className="rounded-full object-cover aspect-square mr-2"
                      />
                    )}
                    <span className="font-semibold">{suggestion.full_name || suggestion.username}</span>
                    {suggestion.full_name && suggestion.username && (
                      <span className="text-muted-foreground ml-2">@{suggestion.username}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>취소</Button>}
          <SubmitButton initialCommentData={initialCommentData} content={content} isSubmitting={isSubmitting} />
        </div>
      </div>
    </form>
  );
}
