"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useLoginDialog } from "@/context/LoginDialogContext";

import { Database } from "@/types/database.types";
import { createLog, updateLog } from "@/app/log/log-actions";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { OgPreviewCard } from "@/components/common/og-preview-card";
import { CertifiedBadge } from "@/components/ui/certified-badge";

interface MentionSuggestion {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface LogEditDialogProps {
  userId: string | null;
  avatarUrl: string | null;
  username: string | null;
  full_name: string | null;
  certified?: boolean | null;
  initialLogData?: Database["public"]["Tables"]["logs"]["Row"];
  children?: React.ReactNode;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = window.matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}

function SubmitButton({
  initialLogData,
  content,
  isSubmitting,
}: {
  initialLogData?: Database["public"]["Tables"]["logs"]["Row"];
  content: string;
  isSubmitting: boolean;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isSubmitting || content.trim() === "";
  return (
    <Button type="submit" disabled={isDisabled}>
      {pending || isSubmitting
        ? initialLogData
          ? "로그 수정 중..."
          : "로그 기록 중..."
        : initialLogData
        ? "로그 수정하기"
        : "로그 기록하기"}
    </Button>
  );
}

function LogForm({
  clientAction,
  initialLogData,
  avatarUrl,
  content,
  handleContentChange,
  handleKeyDown,
  isSubmitting,
  userId,
  openLoginDialog,
  textareaRef,
  showSuggestions,
  mentionSuggestions,
  activeSuggestionIndex,
  handleSelectSuggestion,
  imagePreviewUrl,
  removeImage,
  fileInputRef,
  handleImageChange,
  onCancel,
  setOpen,
  ogUrl,
  suggestionPosition,
}: {
  clientAction: (formData: FormData) => Promise<void>;
  initialLogData?: LogEditDialogProps["initialLogData"];
  avatarUrl: string | null;
  content: string;
  handleContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isSubmitting: boolean;
  userId: string | null;
  openLoginDialog: () => void;
  textareaRef: React.Ref<HTMLTextAreaElement>;
  showSuggestions: boolean;
  mentionSuggestions: MentionSuggestion[];
  activeSuggestionIndex: number;
  handleSelectSuggestion: (suggestion: MentionSuggestion) => void;
  imagePreviewUrl: string | null;
  removeImage: () => void;
  fileInputRef: React.Ref<HTMLInputElement>;
  handleImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel?: () => void;
  setOpen: (open: boolean) => void;
  ogUrl: string | null;
  suggestionPosition: { top: number; left: number };
}) {
  return (
    <form
      action={clientAction}
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="flex-grow flex flex-col p-4 overflow-y-auto">
        {initialLogData && (
          <input type="hidden" name="logId" value={initialLogData.id} />
        )}

        {/* This hidden input is no longer needed as the file itself will be appended to FormData */}
        {/* <input type="hidden" name="imageUrl" value={imageUrlForForm || ""} /> */}

        <div className="flex gap-4 flex-grow min-h-0">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full object-cover aspect-square self-start"
            />
          )}
          <div className="relative flex-grow h-full">
            <Textarea
              name="content"
              placeholder="무슨 생각을 하고 계신가요?"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              disabled={!userId || isSubmitting}
              onClick={() => {
                if (!userId) openLoginDialog();
              }}
              ref={textareaRef}
              className="h-full w-full resize-none border-none p-0 focus-visible:ring-0 shadow-none bg-transparent text-base"
            />
            {showSuggestions && mentionSuggestions.length > 0 && (
              <ul
                className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
                style={{
                  top: `${suggestionPosition.top}px`,
                  left: `${suggestionPosition.left}px`,
                }}
              >
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
        </div>

        {imagePreviewUrl && (
          <>
            <div className="border-t my-4" />
            <div className="relative w-full max-w-xs mx-auto flex-shrink-0">
              <Image
                src={imagePreviewUrl}
                alt="Image preview"
                width={200}
                height={200}
                className="rounded-md object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={removeImage}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
        {ogUrl && !imagePreviewUrl && (
          <>
            <OgPreviewCard url={ogUrl} />
          </>
        )}
      </div>

      <div className="flex justify-between items-center w-full p-4 border-t flex-shrink-0">
        <div>
          <Input
            id="log-image-input"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            className="hidden"
            disabled={isSubmitting}
            ref={fileInputRef}
          />
          <Button
            type="button"
            variant="link"
            size="icon"
            onClick={() => document.getElementById("log-image-input")?.click()}
            disabled={isSubmitting}
            className="hover:bg-secondary"
          >
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                onCancel();
              }}
              disabled={isSubmitting}
            >
              취소
            </Button>
          )}
          <SubmitButton
            initialLogData={initialLogData}
            content={content}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </form>
  );
}

export function LogEditDialog({
  userId,
  avatarUrl,
  username,
  full_name,
  certified,
  initialLogData,
  children,
  onSuccess,
  onCancel,
}: LogEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const dialogTitle = initialLogData ? "로그 수정" : "새 로그 작성";

  const [content, setContent] = useState(initialLogData?.content || "");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialLogData?.image_url || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { openLoginDialog } = useLoginDialog();
  const [ogUrl, setOgUrl] = useState<string | null>(null);

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      setContent(initialLogData?.content || "");
      setImagePreviewUrl(initialLogData?.image_url || null);
      setImageFile(null);
      setIsSubmitting(false);
    }
  }, [open, initialLogData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const urlRegex = /(https?:\/\/[^\s]+)/;
      const match = content.match(urlRegex);
      if (match && match[0] !== ogUrl) {
        setOgUrl(match[0]);
      } else if (!match && ogUrl) {
        setOgUrl(null);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [content, ogUrl]);

  const [mentionSearchTerm, setMentionSearchTerm] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<
    MentionSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({
    top: 0,
    left: 0,
  });

  const fetchMentionSuggestions = useCallback(async (term: string) => {
    if (term.length < 1) {
      setMentionSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    // This requires a client-side supabase instance
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
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
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (mentionSearchTerm) {
        fetchMentionSuggestions(mentionSearchTerm);
      } else {
        setShowSuggestions(false);
        setMentionSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [mentionSearchTerm, fetchMentionSuggestions]);

  const calculateSuggestionPosition = (
    textarea: HTMLTextAreaElement,
    atIndex: number
  ) => {
    // Create a temporary div to measure text dimensions
    const div = document.createElement("div");
    const style = window.getComputedStyle(textarea);
    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.height = "auto";
    div.style.width = textarea.clientWidth + "px";
    div.style.font = style.font;
    div.style.fontSize = style.fontSize;
    div.style.lineHeight = style.lineHeight;
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";

    document.body.appendChild(div);

    const textBeforeAt = textarea.value.substring(0, atIndex);
    div.textContent = textBeforeAt;

    const lines = textBeforeAt.split("\n");
    const currentLineIndex = lines.length - 1;

    // Calculate line height
    const lineHeight =
      parseInt(style.lineHeight) || parseInt(style.fontSize) * 1.2;

    // Position the suggestions below the current line
    const top =
      (currentLineIndex + 1) * lineHeight + parseInt(style.paddingTop);
    const left = parseInt(style.paddingLeft);

    document.body.removeChild(div);

    return { top, left };
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const mentionRegex = /^[a-zA-Z0-9._\uAC00-\uD7A3-]*$/u;
      if (mentionRegex.test(textAfterAt)) {
        setMentionSearchTerm(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        setActiveSuggestionIndex(0);

        // Calculate position for the suggestion dropdown
        const position = calculateSuggestionPosition(e.target, lastAtIndex);
        setSuggestionPosition(position);
      } else {
        setMentionSearchTerm("");
        setShowSuggestions(false);
      }
    } else {
      setMentionSearchTerm("");
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: MentionSuggestion) => {
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
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImagePreviewUrl(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const router = useRouter();

  const clientAction = async (formData: FormData) => {
    if (!userId) {
      openLoginDialog();
      return;
    }
    setIsSubmitting(true);

    formData.set("content", content);
    if (imageFile) {
      formData.append("imageFile", imageFile);
    } else if (!imagePreviewUrl && initialLogData?.image_url) {
      // This indicates the user removed the existing image
      formData.append("imageRemoved", "true");
    }

    const action = initialLogData ? updateLog : createLog;
    const result = await action(formData);

    if (!result.success) {
      alert(`Error: ${result.error.message}`);
    } else {
      if (!initialLogData) {
        // Reset form for creation
        setContent("");
        setImagePreviewUrl(null);
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setOpen(false);
        if (result.data.id) {
          router.push(`/log/${result.data.id}`);
        } else {
          router.refresh();
        }
      } else {
        // Handle success for update
        if (onSuccess) onSuccess();
        setOpen(false);
        router.refresh();
      }
    }
    setIsSubmitting(false);
  };

  const formProps = {
    clientAction,
    initialLogData,
    avatarUrl,
    content,
    handleContentChange,
    handleKeyDown,
    isSubmitting,
    userId,
    openLoginDialog,
    textareaRef,
    showSuggestions,
    mentionSuggestions,
    activeSuggestionIndex,
    handleSelectSuggestion,
    imagePreviewUrl,
    removeImage,
    fileInputRef,
    handleImageChange,
    onCancel,
    setOpen,
    ogUrl,
    suggestionPosition,
  };

  const triggerContent = children || (
    <div className="flex flex-col items-center p-4">
      {avatarUrl && (
        <Image
          src={avatarUrl}
          alt="User Avatar"
          width={60}
          height={60}
          className="rounded-full object-cover aspect-square mb-4"
        />
      )}
      {full_name && (
        <div className="flex items-center gap-1">
          <p className="text-base font-bold">{full_name}</p>
          {certified && <CertifiedBadge size="md" />}
        </div>
      )}
      {username && <p className="text-sm text-gray-500">@{username}</p>}
      <Button variant="default" className="mt-4">
        로그 작성하기
      </Button>
    </div>
  );

  if (!isMounted) {
    return <>{triggerContent}</>;
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{triggerContent}</DialogTrigger>
        <DialogContent
          className="sm:max-w-2xl h-[80vh] max-h-[600px] p-0 flex flex-col"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row justify-between items-center flex-shrink-0 p-4 border-b">
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-sm opacity-70"
              >
                <X size={20} />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </DialogHeader>
          <LogForm {...formProps} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{triggerContent}</DrawerTrigger>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{dialogTitle}</DrawerTitle>
        </DrawerHeader>
        <LogForm {...formProps} />
      </DrawerContent>
    </Drawer>
  );
}
