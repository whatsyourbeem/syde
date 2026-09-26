"use client";

import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo } from "react";
import { updateBio } from "@/app/[username]/actions";
import { useImageUpload } from "@/hooks/use-image-upload";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import RichContent from "@/components/common/rich-content";
import { Json } from "@/types/database.types";
import { isTiptapJsonEmpty } from "@/lib/utils";
import { JSONContent } from "@tiptap/react";
import { useLocalDraft } from "@/hooks/use-local-draft";
import { DraftRestoreBanner } from "@/components/common/draft-restore-banner";
import { normalizeTiptapContent } from "@/lib/tiptap-content-signature";

// The dynamic import for next/dynamic is already present above, no need to duplicate.

const TiptapEditorWrapper = dynamic(
  () => import('@/components/common/tiptap-editor-wrapper'),
  {
    loading: () => <div className="h-32 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">에디터 로딩 중...</div>,
    ssr: false
  }
);

interface BioEditorProps {
  profileId: string;
  initialBio: Json | null;
  initialHtml?: string;
  isOwnProfile: boolean;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
}

function bioDraftSignature(content: JSONContent | null): string {
  return JSON.stringify(content ? normalizeTiptapContent(content) : []);
}

export default function BioEditor({
  profileId,
  initialBio,
  initialHtml,
  isOwnProfile,
  isEditing,
  onEditingChange,
}: BioEditorProps) {
  const { uploadImage } = useImageUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [currentBioContent, setCurrentBioContent] = useState<JSONContent | null>(initialBio as JSONContent | null);

  useEffect(() => {
    setCurrentBioContent(initialBio as JSONContent | null);
  }, [initialBio]);

  const [initialSnapshot] = useState(() => bioDraftSignature(initialBio as JSONContent | null));
  const {
    pendingDraft,
    restore: restoreDraft,
    discard: discardDraft,
    clear: clearDraft,
  } = useLocalDraft({
    key: `syde:bio-draft:${profileId}`,
    data: currentBioContent,
    isPristine: (data) => bioDraftSignature(data) === initialSnapshot,
  });

  // Only ever called from the banner below, which only renders while a pending draft actually exists.
  const handleRestoreDraft = useCallback(() => {
    setCurrentBioContent(restoreDraft());
  }, [restoreDraft]);

  const handleSave = useCallback(async () => {
    if (!currentBioContent) return;

    setIsLoading(true);
    const bioContent = JSON.stringify(currentBioContent);
    const formData = new FormData();
    formData.append("bio", bioContent);

    const result: { error?: string; success?: boolean } = await updateBio(
      formData
    );

    if (result?.error) {
      toast.error("자유 소개 저장 실패", {
        description: result.error,
      });
    } else {
      toast.success("자유 소개 저장 완료");
      clearDraft();
      onEditingChange(false);
    }
    setIsLoading(false);
  }, [currentBioContent, clearDraft, onEditingChange]);

  const handleCancel = useCallback(() => {
    setCurrentBioContent(initialBio as JSONContent | null);
    onEditingChange(false);
  }, [initialBio, onEditingChange]);

  const handleContentChange = useCallback((json: JSONContent) => {
    setCurrentBioContent(json);
  }, []);

  return (
    <div className="relative group">
      {isEditing ? (
        <>
          {pendingDraft && (
            <DraftRestoreBanner savedAt={pendingDraft.savedAt} onDiscard={discardDraft} onRestore={handleRestoreDraft} />
          )}
          <div className="my-2 p-4 border rounded-xl bg-white shadow-sm min-h-[400px]">
            <TiptapEditorWrapper
              initialContent={currentBioContent}
              onContentChange={handleContentChange}
              placeholder="당신의 SYDE를 자유롭게 표현해보세요."
              editable={true}
              onImageUpload={(file) => uploadImage(file, "profiles", "bio", "detail")}
            />
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
              className="rounded-lg"
            >
              취소
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={isLoading}
              className="bg-sydeblue hover:bg-sydeblue/90 rounded-lg"
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col">
          {isTiptapJsonEmpty(initialBio) ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <p className="text-[#777777] text-sm font-light">
                아직 이야기가 시작되지 않았어요.
              </p>
              {isOwnProfile && (
                <Button
                  onClick={() => onEditingChange(true)}
                  className="bg-sydeorange hover:bg-sydeorange/90 text-white text-sm font-bold h-[37px] px-3 rounded-xl gap-2 transition-colors"
                >
                  스토리 작성하기 ✍️
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full">
              <RichContent html={initialHtml ?? ""} />
            </div>
          )}

          {isOwnProfile && !isTiptapJsonEmpty(initialBio) && (
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEditingChange(true)}
                className="text-[#777777] hover:text-sydeblue text-xs font-bold"
              >
                수정
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


