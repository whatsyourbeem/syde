"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useLoginModal } from "@/context/LoginModalContext";
import { Database } from "@/types/database.types";
import { createLog, updateLog } from "@/app/log/actions";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

interface LogFormProps {
  userId: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  username?: string | null;
  full_name?: string | null;
  initialLogData?: Database['public']['Tables']['logs']['Row'];
  onCancel?: () => void;
  onSuccess?: () => void; // New prop for success callback
}

function SubmitButton({ initialLogData, content, isSubmitting }: { initialLogData?: Database['public']['Tables']['logs']['Row'], content: string, isSubmitting: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isSubmitting || content.trim() === "";
  return (
    <Button type="submit" disabled={isDisabled}>
      {pending || isSubmitting
        ? initialLogData ? "로그 수정 중..." : "로그 기록 중..."
        : initialLogData ? "로그 수정하기" : "로그 기록하기"}
    </Button>
  );
}

export function LogForm({
  userId,
  userEmail,
  avatarUrl,
  username,
  full_name,
  initialLogData,
  onCancel,
  onSuccess, // Destructure onSuccess prop
}: LogFormProps) {
  const supabase = createClient();
  const [content, setContent] = useState(initialLogData?.content || "");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialLogData?.image_url || null
  );
  const [imageUrlForForm, setImageUrlForForm] = useState<string | null>(
    initialLogData?.image_url || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { openLoginModal } = useLoginModal();

  // Mention states
  const [mentionSearchTerm, setMentionSearchTerm] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{ id: string; username: string | null; full_name: string | null; avatar_url: string | null; }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    const cursorPosition = e.target.selectionStart;
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
    if (textareaRef.current) {
      const newCursorPosition = mentionStartIndex + (suggestion.username?.length || 0) + 2;
      textareaRef.current.selectionStart = newCursorPosition;
      textareaRef.current.selectionEnd = newCursorPosition;
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (!userId) return;
      setIsUploading(true);
      setImagePreviewUrl(URL.createObjectURL(file));
      try {
        const publicUrl = await uploadImage(file, userId);
        setImageUrlForForm(publicUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeImage = () => {
    setImagePreviewUrl(null);
    setImageUrlForForm(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const uploadImage = useCallback(async (file: File, userId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("logimages")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from("logimages").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  }, [supabase]);

  const router = useRouter();

  const clientAction = useCallback(async (formData: FormData) => {
    if (!userId) {
      openLoginModal();
      return;
    }

    setIsSubmitting(true);

    // The server action will process mentions
    formData.set("content", content);

    const action = initialLogData ? updateLog : createLog;
    const result = await action(formData);

    if (result?.error) {
      alert(`Error: ${result.error}`);
    } else {
      // Reset form only for new log creation
      if (!initialLogData) {
        setContent("");
        setImagePreviewUrl(null);
        setImageUrlForForm(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
      // Call onSuccess callback if provided and it's an update operation
      if (initialLogData && onSuccess) {
        onSuccess();
      } else if (result?.logId) {
        router.push(`/log/${result.logId}`);
      } else {
        // Fallback for update, if no specific logId is returned
        router.refresh();
      }
    }
    setIsSubmitting(false);
  }, [userId, content, initialLogData, openLoginModal, router, onSuccess]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-4 border rounded-lg shadow-sm bg-card">
      <form action={clientAction} className="space-y-4">
        {initialLogData && <input type="hidden" name="logId" value={initialLogData.id} />}
        <input type="hidden" name="imageUrl" value={imageUrlForForm || ""} />

        {!initialLogData && (
          <div className="flex items-center gap-4 mt-0">
            {avatarUrl && <Image src={avatarUrl} alt="User Avatar" width={40} height={40} className="rounded-full object-cover" />}
            <div>
              <p className="font-semibold">{full_name || username || userEmail}</p>
            </div>
          </div>
        )}
        <div className="relative">
          <Textarea
            name="content"
            placeholder="무슨 생각을 하고 계신가요?"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={isUploading || !userId || isSubmitting}
            onClick={() => { if (!userId) openLoginModal(); }}
            ref={textareaRef}
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
        {imagePreviewUrl && (
          <div className="relative w-full max-w-xs mx-auto">
            <Image src={imagePreviewUrl} alt="Image preview" width={400} height={400} className="rounded-md object-contain" />
            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={removeImage} disabled={isUploading || isSubmitting}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            <Input
              id="log-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isUploading || isSubmitting}
              ref={fileInputRef}
            />
            <Button
              type="button"
              variant="link"
              size="icon"
              onClick={() => document.getElementById('log-image-input')?.click()}
              disabled={isUploading || isSubmitting}
              className="hover:bg-secondary"
            >
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading || isSubmitting}>
                취소
              </Button>
            )}
            <SubmitButton initialLogData={initialLogData} content={content} isSubmitting={isSubmitting} />
          </div>
        </div>
      </form>
    </div>
  );
}
