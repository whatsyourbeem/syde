"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useLoginDialog } from "@/context/LoginDialogContext";

import { Database } from "@/types/database.types";
import { createLog, updateLog } from "@/app/log/actions";
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
  imageUrlForForm,
  avatarUrl,
  content,
  handleContentChange,
  handleKeyDown,
  isUploading,
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
}: {
  clientAction: (formData: FormData) => Promise<void>;
  initialLogData?: LogEditDialogProps["initialLogData"];
  imageUrlForForm: string | null;
  avatarUrl: string | null;
  content: string;
  handleContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isUploading: boolean;
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
        <input type="hidden" name="imageUrl" value={imageUrlForForm || ""} />

        <div className="flex gap-4 flex-grow min-h-0">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full object-cover self-start"
            />
          )}
          <div className="relative flex-grow h-full">
            <Textarea
              name="content"
              placeholder="무슨 생각을 하고 계신가요?"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              disabled={isUploading || !userId || isSubmitting}
              onClick={() => {
                if (!userId) openLoginDialog();
              }}
              ref={textareaRef}
              className="h-full w-full resize-none border-none p-0 focus-visible:ring-0 shadow-none bg-transparent"
            />
            {showSuggestions && mentionSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg bottom-full mb-1 max-h-60 overflow-auto">
                {mentionSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    className={`px-4 py-2 cursor-pointer hover:bg-accent ${
                      index === activeSuggestionIndex ? "bg-accent" : ""
                    }`}
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
                      <span className="font-semibold">
                        {suggestion.full_name || suggestion.username}
                      </span>
                      {suggestion.full_name && suggestion.username && (
                        <span className="text-muted-foreground ml-2">
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
                disabled={isUploading || isSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between items-center w-full p-4 border-t flex-shrink-0">
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
            onClick={() => document.getElementById("log-image-input")?.click()}
            disabled={isUploading || isSubmitting}
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
              disabled={isUploading || isSubmitting}
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
  const { openLoginDialog } = useLoginDialog();
  

  const [mentionSearchTerm, setMentionSearchTerm] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<
    MentionSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

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
    return () => clearTimeout(handler);
  }, [mentionSearchTerm, fetchMentionSuggestions]);

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

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = useCallback(
    async (file: File, userId: string) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("logimages")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from("logimages")
        .getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    },
    [supabase]
  );

  const router = useRouter();

  const clientAction = useCallback(
    async (formData: FormData) => {
      if (!userId) {
        openLoginDialog();
        return;
      }
      setIsSubmitting(true);
      formData.set("content", content);
      const action = initialLogData ? updateLog : createLog;
      const result = await action(formData);
      if (result?.error) {
        alert(`Error: ${result.error}`);
      } else {
        if (!initialLogData) {
          setContent("");
          setImagePreviewUrl(null);
          setImageUrlForForm(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          setOpen(false);
          if (result?.logId) {
            router.push(`/log/${result.logId}`);
          } else {
            router.refresh();
          }
        } else {
          if (onSuccess) onSuccess();
          setOpen(false);
          router.refresh();
        }
      }
      setIsSubmitting(false);
    },
    [userId, content, initialLogData, openLoginDialog, router, onSuccess]
  );

  const formProps = {
    clientAction,
    initialLogData,
    imageUrlForForm,
    avatarUrl,
    content,
    handleContentChange,
    handleKeyDown,
    isUploading,
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
  };

  const triggerContent = children || (
    <div className="flex flex-col items-center p-4">
      {avatarUrl && (
        <Image
          src={avatarUrl}
          alt="User Avatar"
          width={60}
          height={60}
          className="rounded-full object-cover mb-4"
        />
      )}
      {full_name && <p className="text-base font-bold">{full_name}</p>}
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
