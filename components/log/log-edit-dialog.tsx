"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useActionState,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { Database } from "@/types/database.types";
import { createLog, updateLog } from "@/app/log/log-actions";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createClient } from "@/lib/supabase/client";
import { compressImage, FILE_SIZE_LIMIT } from "@/lib/image-compression";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { useQueryClient } from "@tanstack/react-query";
import { CertifiedBadge } from "@/components/ui/certified-badge";
import { OgPreviewCard } from "@/components/common/og-preview-card";

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

function SubmitButton({
  initialLogData,
  content,
  isCompressing,
}: {
  initialLogData?: Database["public"]["Tables"]["logs"]["Row"];
  content: string;
  isCompressing: boolean;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isCompressing || content.trim() === "";
  return (
    <Button type="submit" disabled={isDisabled}>
      {isCompressing
        ? "업로드 중..."
        : pending
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
  formAction,
  initialLogData,
  avatarUrl,
  content,
  handleContentChange,
  handleKeyDown,
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
  isCompressing,
  onCancel,
  setOpen,
  ogUrl,
  suggestionPosition,
}: {
  formAction: (formData: FormData) => void;
  initialLogData?: LogEditDialogProps["initialLogData"];
  avatarUrl: string | null;
  content: string;
  handleContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
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
  isCompressing: boolean;
  onCancel?: () => void;
  setOpen: (open: boolean) => void;
  ogUrl: string | null;
  suggestionPosition: { top: number; left: number };
}) {
  const { pending } = useFormStatus();

  return (
    <form action={formAction} className="flex flex-col h-full overflow-hidden">
      <div className="flex-grow flex flex-col p-4 overflow-y-auto">
        {initialLogData && (
          <input type="hidden" name="logId" value={initialLogData.id} />
        )}
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
              disabled={!userId || pending}
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
                    className={`px-4 py-2 cursor-pointer hover:bg-accent ${index === activeSuggestionIndex ? "bg-accent" : ""
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
                disabled={pending}
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
            disabled={pending || isCompressing}
            ref={fileInputRef}
          />
          <Button
            type="button"
            variant="link"
            size="icon"
            onClick={() => document.getElementById("log-image-input")?.click()}
            disabled={pending || isCompressing}
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
              disabled={pending}
            >
              취소
            </Button>
          )}
          <SubmitButton initialLogData={initialLogData} content={content} isCompressing={isCompressing} />
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
  const router = useRouter();
  const queryClient = useQueryClient();

  const supabase = createClient();
  const [content, setContent] = useState(initialLogData?.content || "");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialLogData?.image_url || null
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialLogData?.image_url || null
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const newlyUploadedUrl = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { openLoginDialog } = useLoginDialog();
  const [ogUrl, setOgUrl] = useState<string | null>(null);

  const action = initialLogData ? updateLog : createLog;
  const [state, formAction] = useActionState(action, {
    error: undefined,
    id: undefined,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset form state when dialog is closed
  useEffect(() => {
    if (!open) {
      setContent(initialLogData?.content || "");
      setImagePreviewUrl(initialLogData?.image_url || null);
      setImageUrl(initialLogData?.image_url || null);
      newlyUploadedUrl.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, initialLogData]);

  // Handle form submission result
  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.id) {
      toast.success(
        initialLogData ? "로그가 수정되었습니다." : "로그가 기록되었습니다."
      );
      setOpen(false);
      if (onSuccess) onSuccess();

      // Invalidate the logs query to ensure the list is fresh
      queryClient.invalidateQueries({ queryKey: ["logs"] });

      if (!initialLogData && state.id) {
        router.push(`/log/${state.id}`);
      } else {
        router.refresh();
      }
    }
  }, [state, initialLogData, onSuccess, router, queryClient]);

  // OG URL detection
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
    return () => clearTimeout(handler);
  }, [content, ogUrl]);

  // Mention suggestions logic
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
    const div = document.createElement("div");
    const style = window.getComputedStyle(textarea);
    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.height = "auto";
    div.style.width = textarea.clientWidth + "px";
    div.style.font = style.font;
    div.style.lineHeight = style.lineHeight;
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    document.body.appendChild(div);
    div.textContent = textarea.value.substring(0, atIndex);
    const rect = div.getBoundingClientRect();
    document.body.removeChild(div);
    return { top: rect.height, left: 0 };
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
        const position = calculateSuggestionPosition(e.target, lastAtIndex);
        setSuggestionPosition(position);
      } else {
        setShowSuggestions(false);
      }
    } else {
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
    setShowSuggestions(false);
    if (textareaRef.current) {
      const newCursorPosition =
        mentionStartIndex + (suggestion.username?.length || 0) + 2;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        newCursorPosition,
        newCursorPosition
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex(
          (prev) => (prev + 1) % mentionSuggestions.length
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex(
          (prev) =>
            (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelectSuggestion(mentionSuggestions[activeSuggestionIndex]);
      }
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    const file = event.target.files[0];

    if (file.size > FILE_SIZE_LIMIT) {
      toast.error("이미지는 20MB를 초과할 수 없습니다.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsCompressing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const compressed = await compressImage(file, "thumbnail");
      const fileName = `${user.id}/${crypto.randomUUID()}`;

      const { error } = await supabase.storage
        .from("logs")
        .upload(fileName, compressed);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("logs")
        .getPublicUrl(fileName);

      // 이전에 이번 세션에서 업로드한 이미지가 있으면 storage에서 삭제
      if (newlyUploadedUrl.current) {
        const oldPath = newlyUploadedUrl.current.split("/storage/v1/object/public/logs/")[1];
        if (oldPath) await supabase.storage.from("logs").remove([oldPath]);
      }

      newlyUploadedUrl.current = publicUrl;
      setImageUrl(publicUrl);
      setImagePreviewUrl(publicUrl);
    } catch (err) {
      console.error(err);
      toast.error("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = async () => {
    // 이번 세션에 새로 업로드된 파일이면 storage에서 즉시 삭제
    if (newlyUploadedUrl.current) {
      const path = newlyUploadedUrl.current.split("/storage/v1/object/public/logs/")[1];
      if (path) await supabase.storage.from("logs").remove([path]);
      newlyUploadedUrl.current = null;
    }
    setImageUrl(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formProps = {
    formAction: (formData: FormData) => {
      if (!userId) {
        openLoginDialog();
        return;
      }
      formData.append("imageUrl", imageUrl ?? "");
      formAction(formData);
    },
    initialLogData,
    avatarUrl,
    content,
    handleContentChange,
    handleKeyDown,
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
    isCompressing,
    onCancel,
    setOpen,
    ogUrl,
    suggestionPosition,
  };

  const dialogTitle = initialLogData ? "로그 수정" : "새 로그 작성";
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

  if (!isMounted) return <>{triggerContent}</>;

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
