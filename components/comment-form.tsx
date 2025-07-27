"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input"; // Import Input instead of Textarea
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLoginModal } from "@/context/LoginModalContext";
import Image from "next/image";
import { Database } from "@/types/database.types";

interface CommentFormProps {
  logId: string;
  currentUserId: string | null;
  onCommentAdded?: () => void;
  initialCommentData?: Database['public']['Tables']['log_comments']['Row'];
  onCommentUpdated?: () => void;
  onCancel?: () => void;
}

import { processMentionsForSave } from "@/lib/utils";

export function CommentForm({
  logId,
  currentUserId,
  onCommentAdded,
  initialCommentData,
  onCommentUpdated,
  onCancel,
}: CommentFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [content, setContent] = useState(initialCommentData?.content || "");
  const [loading, setLoading] = useState(false);
  const { openLoginModal } = useLoginModal();
  const inputRef = useRef<HTMLInputElement>(null); // Change to HTMLInputElement

  // Mention states
  const [mentionSearchTerm, setMentionSearchTerm] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{ id: string; username: string | null; full_name: string | null; avatar_url: string | null; }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // Debounce for mention search
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
  }, [mentionSearchTerm]);

  const fetchMentionSuggestions = async (term: string) => {
    if (term.length < 1) {
      setMentionSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url') // Added avatar_url
      .ilike('username', `%${term}%`)
      .limit(5);

    if (error) {
      console.error("Error fetching mention suggestions:", error);
      setMentionSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setMentionSuggestions(data || []);
    setShowSuggestions(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Change to HTMLInputElement
    const newContent = e.target.value;
    setContent(newContent);

    const cursorPosition = e.target.selectionStart;
    if (cursorPosition === null) return;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const mentionRegex = /^[a-zA-Z0-9._-]*$/;
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
    if (inputRef.current) { // Change to inputRef
      const newCursorPosition = mentionStartIndex + (suggestion.username?.length || 0) + 2;
      inputRef.current.selectionStart = newCursorPosition; // Change to inputRef
      inputRef.current.selectionEnd = newCursorPosition; // Change to inputRef
      inputRef.current.focus(); // Change to inputRef
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { // Change to HTMLInputElement
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

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!currentUserId) {
        openLoginModal();
        return;
      }

      setLoading(true);

      try {
        const processedContent = await processMentionsForSave(
          content,
          supabase
        );

        if (initialCommentData) {
          const { error } = await supabase
            .from("log_comments")
            .update({ content: processedContent })
            .eq("id", initialCommentData.id);

          if (error) {
            throw error;
          }
          queryClient.invalidateQueries({ queryKey: ["comments", { logId }] });
          if (onCommentUpdated) onCommentUpdated();
        } else {
          const { error } = await supabase.from("log_comments").insert({
            log_id: logId,
            user_id: currentUserId,
            content: processedContent,
          });

          if (error) {
            throw error;
          }
          queryClient.invalidateQueries({ queryKey: ["comments", { logId }] });
          if (onCommentAdded) onCommentAdded();
        }

        setContent("");
      } catch (error: any) {
        alert(
          `댓글 ${initialCommentData ? "수정" : "추가"} 중 오류가 발생했습니다: ${
            error.message
          }`
        );
      } finally {
        setLoading(false);
      }
    },
    [
      logId,
      currentUserId,
      content,
      router,
      supabase,
      onCommentAdded,
      initialCommentData,
      onCommentUpdated,
      queryClient,
    ]
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4 relative">
      <div className="flex-grow relative">
        <Input // Change to Input
          placeholder={
            initialCommentData ? "댓글을 수정하세요..." : "댓글을 작성하세요..."
          }
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          disabled={loading} // Removed || !currentUserId
          onClick={() => {
            if (!currentUserId) openLoginModal();
          }} // Open modal on click if not logged in
          className="w-full pr-20"
          ref={inputRef} // Change to inputRef
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
                      className="rounded-full object-cover mr-2"
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
      <div className="flex flex-col gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full"
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || content.trim() === "" || !currentUserId}
        >
          {loading
            ? initialCommentData
              ? "수정 중..."
              : "작성 중..."
            : initialCommentData
            ? "수정"
            : "작성"}
        </Button>
      </div>
    </form>
  );
}
