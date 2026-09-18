"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { Tables } from "@/types/database.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useLocalDraft } from "@/hooks/use-local-draft";
import { DraftRestoreBanner } from "@/components/common/draft-restore-banner";
import { normalizeTiptapContent } from "@/lib/tiptap-content-signature";
import { Loader2 } from "lucide-react";

const TiptapEditorWrapper = dynamic(
  () => import("@/components/common/tiptap-editor-wrapper"),
  {
    loading: () => (
      <div className="h-32 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">
        에디터 로딩 중...
      </div>
    ),
    ssr: false,
  }
);
import { JSONContent } from "@tiptap/react";
import { createClub, updateClub } from "@/app/club/club-actions";

interface ClubFormProps {
  club?: Tables<"clubs">;
}

interface ClubDraftData {
  name: string;
  tagline: string;
  description: JSONContent | null;
  thumbnailUrl: string | null;
}

function clubDraftSignature(data: ClubDraftData): string {
  return JSON.stringify([
    data.name.trim(),
    data.tagline.trim(),
    data.description ? normalizeTiptapContent(data.description) : [],
    data.thumbnailUrl,
  ]);
}



export default function ClubEditForm({ club }: ClubFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditMode = !!club;

  const [name, setName] = useState(club?.name || "");
  const [tagline, setTagline] = useState(club?.tagline || "");
  const [description, setDescription] = useState<JSONContent | null>(() => {
    if (club?.description) {
      if (typeof club.description === "object" && club.description !== null) {
        return club.description as JSONContent;
      }
      if (typeof club.description === "string") {
        try {
          return JSON.parse(club.description);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    club?.thumbnail_url || null
  );

  const { isUploading: isImageUploading, uploadImage } = useImageUpload();
  const isCompressing = isImageUploading;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const draftData = useMemo<ClubDraftData>(
    () => ({ name, tagline, description, thumbnailUrl }),
    [name, tagline, description, thumbnailUrl],
  );
  const [initialSnapshot] = useState(() => clubDraftSignature(draftData));
  const {
    pendingDraft,
    restore: restoreDraft,
    discard: discardDraft,
    clear: clearDraft,
  } = useLocalDraft({
    key: `syde:club-draft:${club?.id ?? "new"}`,
    data: draftData,
    isPristine: (data) => clubDraftSignature(data) === initialSnapshot,
  });

  const handleRestoreDraft = () => {
    const draft = restoreDraft();
    if (!draft) return;
    setName(draft.name);
    setTagline(draft.tagline);
    setDescription(draft.description);
    setThumbnailUrl(draft.thumbnailUrl);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const publicUrl = await uploadImage(file, "clubs", "", "thumbnail");
    if (publicUrl) {
      setThumbnailUrl(publicUrl);
    }
  };

  // uploadImage reports its own failures; resolving null keeps the editor from toasting a second time.
  const handleEditorImageUpload = (file: File) => uploadImage(file, "clubs", "editor", "detail");

  const clientAction = async (formData: FormData) => {
    setIsSubmitting(true);

    formData.append("name", name);
    formData.append("tagline", tagline);
    formData.append("description", JSON.stringify(description));

    if (isEditMode && club) {
      formData.append("id", club.id);
    }
    formData.append("thumbnailUrl", thumbnailUrl || "");

    const result = isEditMode
      ? await updateClub(formData)
      : await createClub(formData);

    if (!result.success) {
      toast.error(
        `클럽 ${isEditMode ? "업데이트" : "생성"} 실패: ${result.error.message}`
      );
    } else {
      toast.success(
        `클럽이 성공적으로 ${
          isEditMode ? "업데이트되었습니다" : "생성되었습니다"
        }.`
      );
      clearDraft();
      const clubId = isEditMode ? club!.id : result.data?.id;
      router.push(`/club/${clubId}`);
      router.refresh();
    }
    setIsSubmitting(false);
  };

  return (
    <form
      action={clientAction}
      ref={formRef}
      className="w-full max-w-2xl space-y-6 p-4 bg-white rounded-lg"
    >
      {pendingDraft && (
        <DraftRestoreBanner
          savedAt={pendingDraft.savedAt}
          preview={pendingDraft.data.name}
          onDiscard={discardDraft}
          onRestore={handleRestoreDraft}
        />
      )}
      <div>
        <Label htmlFor="name">클럽 이름</Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="tagline">한 줄 소개</Label>
        <Input
          id="tagline"
          name="tagline"
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="클럽을 한 줄로 소개해주세요."
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">클럽 설명</Label>
        <div className="border border-input rounded-md p-4 min-h-[400px]">
          <TiptapEditorWrapper
            initialContent={description}
            onContentChange={(json) => setDescription(json)}
            placeholder="클럽 설명을 입력하세요..."
            onImageUpload={handleEditorImageUpload}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="thumbnail">썸네일 이미지</Label>
        <div className="mt-1 flex flex-col items-center space-y-4">
          {thumbnailUrl && (
            <div className="w-40 h-40 relative mx-auto">
              <Image
                src={thumbnailUrl}
                alt="Thumbnail preview"
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}
          <Input
            id="thumbnailFile"
            name="thumbnailFile"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            disabled={isCompressing}
          >
            {isCompressing ? <Loader2 className="w-4 h-4 animate-spin" /> : "이미지 선택"}
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting || isCompressing} className="w-full">
        {isSubmitting
          ? isEditMode
            ? "저장 중..."
            : "생성 중..."
          : isEditMode
          ? "정보 저장"
          : "클럽 생성"}
      </Button>
    </form>
  );
}
