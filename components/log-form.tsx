"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLoginModal } from "@/context/LoginModalContext"; // Import useLoginModal
import { Database } from "@/types/database.types";

interface LogFormProps {
  userId: string | null;
  userEmail?: string | null; // Made optional for editing
  avatarUrl?: string | null; // Made optional for editing
  username?: string | null; // Made optional for editing
  full_name?: string | null; // Added for full_name display
  initialLogData?: Database['public']['Tables']['logs']['Row']; // New prop for editing
  onLogUpdated?: (updatedLog: Database['public']['Tables']['logs']['Row']) => void; // Callback for successful update
  onCancel?: () => void; // Callback for cancel button in edit mode
}

import { processMentionsForSave } from "@/lib/utils";

export function LogForm({
  userId,
  userEmail,
  avatarUrl,
  username,
  full_name, // Add full_name here
  initialLogData,
  onLogUpdated,
  onCancel,
}: LogFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [content, setContent] = useState(initialLogData?.content || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialLogData?.image_url || null
  );
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Add ref for file input
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for textarea
  const { openLoginModal } = useLoginModal(); // Use the hook

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Regex to check if the text after @ is a valid username character sequence
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
    // Optionally, set cursor position after the inserted mention
    if (textareaRef.current) {
      const newCursorPosition = mentionStartIndex + (suggestion.username?.length || 0) + 2; // +2 for '@' and space
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const resizeImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              }
            },
            file.type,
            quality
          );
        };
      };
    });
  };

  const uploadImage = async (file: File, userId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const resizedBlob = await resizeImage(file, 800, 800, 0.8); // Max 800x800, 80% quality
    const resizedFile = new File([resizedBlob], fileName, { type: file.type });

    const { error: uploadError } = await supabase.storage
      .from("logimages") // Changed to logimages
      .upload(filePath, resizedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("logimages")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!userId) {
        openLoginModal(); // Open login modal
        return;
      }

      setLoading(true);
      let imageUrl: string | null = initialLogData?.image_url || null;

      try {
        // Handle image upload/removal only if a new file is selected or existing image is cleared
        if (imageFile) {
          imageUrl = await uploadImage(imageFile, userId);
        } else if (initialLogData?.image_url && !imagePreviewUrl) {
          // If image was cleared in edit mode
          const url = new URL(initialLogData.image_url);
          const path = url.pathname.split("/logimages/")[1];
          if (path) {
            await supabase.storage.from("logimages").remove([path]);
          }
          imageUrl = null;
        }

        const processedContent = await processMentionsForSave(content, supabase);

        if (initialLogData) {
          // Update existing log
          const { data, error } = await supabase
            .from("logs")
            .update({
              content: processedContent,
              image_url: imageUrl,
            })
            .eq("id", initialLogData.id)
            .select(); // Add .select() to return the updated data

          if (error) {
            throw error;
          }
          if (onLogUpdated && data && data.length > 0) onLogUpdated(data[0]);
        } else {
          // Insert new log
          const { error } = await supabase.from("logs").insert({
            user_id: userId,
            content: processedContent,
            image_url: imageUrl,
          });

          if (error) {
            throw error;
          }
        }

        setContent("");
        setImageFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Clear the file input
        }
      } catch (error: any) {
        alert(`로그 기록 중 오류가 발생했습니다: ${error.message}`); // Changed alert message
      } finally {
        setLoading(false);
      }
    },
    [
      userId,
      content,
      imageFile,
      router,
      supabase,
      initialLogData,
      onLogUpdated,
      imagePreviewUrl,
    ]
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-4 border rounded-lg shadow-sm bg-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!initialLogData && (
          <div className="flex items-center gap-4">
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-semibold">{full_name || username || userEmail}</p>
            </div>
          </div>
        )}
        <div className="relative">
          <Textarea
            placeholder="무슨 생각을 하고 계신가요?"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={loading} // Removed || !userId
            onClick={() => {
              if (!userId) openLoginModal();
            }} // Open modal on click if not logged in
            ref={textareaRef} // Attach ref to the Textarea component
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
          <div className="relative w-full h-48 rounded-md overflow-hidden">
            <Image
              src={imagePreviewUrl}
              alt="Image preview"
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}
        <div className="flex justify-between items-center">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-auto"
            disabled={loading} // Removed || !userId
            ref={fileInputRef} // Attach ref to the Input component
            onClick={() => {
              if (!userId) openLoginModal();
            }} // Open modal on click if not logged in
          />
          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                취소
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || content.trim() === "" || !userId}
            >
              {" "}
              {/* Disable if not logged in */}
              {loading
                ? initialLogData
                  ? "로그 수정 중..."
                  : "로그 기록 중..."
                : initialLogData
                ? "로그 수정하기"
                : "로그 기록하기"}{" "}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
