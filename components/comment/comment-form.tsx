"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment as createLogComment, updateComment as updateLogComment } from "@/app/log/log-actions";
import { createComment as createShowcaseComment, updateComment as updateShowcaseComment } from "@/app/showcase/showcase-actions";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useFormStatus } from "react-dom";
import { Database } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { X } from "lucide-react";

interface CommentFormProps {
  logId?: string;
  showcaseId?: string;
  currentUserId: string | null;
  parentCommentId?: string | null;
  initialCommentData?: Database["public"]["Tables"]["log_comments"]["Row"]; // This type might need adjustment if comments are separate for showcase
  onCommentAdded?: () => void;
  onCommentUpdated?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  replyTo?: {
    parentId: string;
    authorName: string | null;
    authorUsername: string | null;
    authorAvatarUrl: string | null;
  } | null;
}

function SubmitButton({
  initialCommentData,
  content,
  isSubmitting,
}: {
  initialCommentData?: Database["public"]["Tables"]["log_comments"]["Row"];
  content: string;
  isSubmitting: boolean;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isSubmitting || content.trim() === "";
  return (
    <Button type="submit" disabled={isDisabled}>
      {pending || isSubmitting
        ? initialCommentData
          ? "수정 중..."
          : "등록 중..."
        : initialCommentData
        ? "수정"
        : "등록"}
    </Button>
  );
}

export function CommentForm({
  logId,
  showcaseId,
  currentUserId,
  parentCommentId,
  initialCommentData,
  onCommentAdded,
  onCommentUpdated,
  onCancel,
  placeholder,
  replyTo,
}: CommentFormProps) {
  const supabase = createClient();
  const { openLoginDialog } = useLoginDialog();

  const formRef = useRef<HTMLFormElement>(null);
  const [content, setContent] = useState(initialCommentData?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    avatar_url: string | null;
    username: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUserId) {
        setCurrentUserProfile(null);
        return;
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, username")
        .eq("id", currentUserId)
        .single();
      
      if (!error && data) {
        setCurrentUserProfile(data);
      }
    };
    
    fetchProfile();
  }, [currentUserId, supabase]);

  useEffect(() => {
    if (!initialCommentData) {
      if (replyTo && replyTo.authorUsername) {
        setContent(`@${replyTo.authorUsername} `);
        if (textareaRef.current) {
          console.log("Attempting to focus textarea:", textareaRef.current);
          textareaRef.current.focus();
        }
      } else {
        setContent("");
      }
    }
  }, [replyTo, initialCommentData]);

  // Mention states
  const [mentionSearchTerm, setMentionSearchTerm] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<
    Array<{
      id: string;
      username: string | null;
      full_name: string | null;
      avatar_url: string | null;
    }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Mobile keyboard handling
  useEffect(() => {
    let initialScrollY = 0;

    const handleFocus = () => {
      // Store initial scroll position
      initialScrollY = window.scrollY;

      if (formRef.current) {
        formRef.current.classList.add("keyboard-open");
      }

      // Prevent iOS viewport shift by restoring scroll position
      setTimeout(() => {
        if (window.scrollY !== initialScrollY) {
          window.scrollTo(0, initialScrollY);
        }
      }, 100);
    };

    const handleBlur = () => {
      if (formRef.current) {
        formRef.current.classList.remove("keyboard-open");
      }

      // Restore original scroll position if needed
      setTimeout(() => {
        window.scrollTo(0, initialScrollY);
      }, 100);
    };

    const inputElement = textareaRef.current;
    if (inputElement) {
      inputElement.addEventListener("focus", handleFocus);
      inputElement.addEventListener("blur", handleBlur);

      return () => {
        inputElement.removeEventListener("focus", handleFocus);
        inputElement.removeEventListener("blur", handleBlur);
      };
    }
  }, []);

  const fetchMentionSuggestions = useCallback(
    async (term: string) => {
      if (term.length < 1) {
        setMentionSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
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
    },
    [supabase]
  );

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    const cursorPosition = e.target.selectionStart;
    if (cursorPosition === null) return;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

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

  const handleSelectSuggestion = (suggestion: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  }) => {
    if (mentionStartIndex === -1) return;

    const newContent =
      content.substring(0, mentionStartIndex) +
      `@${suggestion.username} ` +
      content.substring(mentionStartIndex + mentionSearchTerm.length + 1);

    setContent(newContent);
    setMentionSearchTerm("");
    setShowSuggestions(false);
    if (textareaRef.current) {
      const newCursorPosition =
        mentionStartIndex + (suggestion.username?.length || 0) + 2;
      textareaRef.current.selectionStart = newCursorPosition;
      textareaRef.current.selectionEnd = newCursorPosition;
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex(
          (prevIndex) => (prevIndex + 1) % mentionSuggestions.length
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex(
          (prevIndex) =>
            (prevIndex - 1 + mentionSuggestions.length) %
            mentionSuggestions.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelectSuggestion(mentionSuggestions[activeSuggestionIndex]);
      }
    } else {
      // Option 1: Enter for newline, Cmd/Ctrl+Enter for submit
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (content.trim() !== "" && !isSubmitting) {
          formRef.current?.requestSubmit();
        }
      }
    }
  };

  const handleInputClick = () => {
    if (!currentUserId) {
      openLoginDialog();
    }
  };

  const clientAction = async (formData: FormData) => {
    if (!currentUserId) {
      openLoginDialog();
      return;
    }

    setIsSubmitting(true);

    formData.set("content", content);
    if (logId) {
      formData.set("log_id", logId);
    } else if (showcaseId) {
      formData.set("showcase_id", showcaseId);
    }

    const isLog = !!logId;
    const createAction = isLog ? createLogComment : createShowcaseComment;
    const updateAction = isLog ? updateLogComment : updateShowcaseComment;
    const actionToCall = initialCommentData ? updateAction : createAction;

    try {
      await actionToCall(formData);
      if (initialCommentData) {
        if (onCommentUpdated) onCommentUpdated();
      } else {
        formRef.current?.reset();
        setContent("");
        if (onCommentAdded) onCommentAdded();
      }
    } catch (e) {
      alert(`Error: ${(e as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      action={clientAction}
      className="flex flex-col gap-2 mx-2 my-2 relative mobile-keyboard-fix"
    >
      {logId && <input type="hidden" name="log_id" value={logId} />}
      {showcaseId && <input type="hidden" name="showcase_id" value={showcaseId} />}
      {initialCommentData && (
        <input type="hidden" name="comment_id" value={initialCommentData.id} />
      )}
      {parentCommentId && (
        <input type="hidden" name="parent_comment_id" value={parentCommentId} />
      )}
      <div className="flex items-start gap-3">
        {/* Current User Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="relative w-9 h-9 overflow-hidden rounded-full bg-[#D9D9D9]">
            <Image
              src={currentUserProfile?.avatar_url || "/default_avatar.png"}
              alt="My avatar"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex-grow flex gap-2">
          <div className="flex-grow relative">
            <Textarea
              name="content"
              placeholder={
                placeholder ||
                (initialCommentData
                  ? "댓글을 수정하세요..."
                  : parentCommentId
                  ? "답글을 작성하세요..."
                  : "댓글을 작성하세요...")
              }
              disabled={isSubmitting}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className="w-full text-sm placeholder:text-sm pr-1 min-h-[40px] max-h-[132px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none border-[#E5E5E5] bg-white rounded-[8px] no-scrollbar overflow-y-auto"
              ref={textareaRef}
              onClick={handleInputClick}
              rows={1}
            />

            {showSuggestions && mentionSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                {mentionSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    className={`px-4 py-2 cursor-pointer hover:bg-accent ${
                      index === activeSuggestionIndex ? "bg-accent" : ""
                    }`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <div className="flex items-center text-xs">
                      {suggestion.avatar_url && (
                        <Image
                          src={suggestion.avatar_url}
                          alt={`${suggestion.username}'s avatar`}
                          width={24}
                          height={24}
                          className="rounded-full object-cover aspect-square mr-2"
                        />
                      )}
                      <span className="font-semibold truncate">
                        {suggestion.full_name || suggestion.username}
                      </span>
                      {suggestion.full_name && suggestion.username && (
                        <span className="text-muted-foreground ml-2 truncate">
                          @{suggestion.username}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-start gap-2">
            {initialCommentData && onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                취소
              </Button>
            )}
            <SubmitButton
              initialCommentData={initialCommentData}
              content={content}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
