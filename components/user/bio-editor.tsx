"use client";

import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { updateBio, uploadBioImage } from "@/app/[username]/actions";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import TiptapViewer from "@/components/common/tiptap-viewer";
import { Json } from "@/types/database.types";
import { isTiptapJsonEmpty } from "@/lib/utils";
import { JSONContent } from "@tiptap/react";
import { cn } from "@/lib/utils";
// The dynamic import for next/dynamic is already present above, no need to duplicate.

const TiptapEditorWrapper = dynamic(
  () => import('@/components/common/tiptap-editor-wrapper'),
  {
    loading: () => <div className="h-32 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">에디터 로딩 중...</div>,
    ssr: false
  }
);

interface BioEditorProps {
  initialBio: Json | null;
  initialHtml?: string;
  isOwnProfile: boolean;
  link?: string | null;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
}

export default function BioEditor({
  initialBio,
  initialHtml,
  isOwnProfile,
  link,
  isEditing,
  onEditingChange,
}: BioEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBioContent, setCurrentBioContent] = useState<JSONContent | null>(initialBio as JSONContent | null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setCurrentBioContent(initialBio as JSONContent | null);
  }, [initialBio]);

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
      onEditingChange(false);
    }
    setIsLoading(false);
  }, [currentBioContent, onEditingChange]);

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
          <div className="my-2 p-4 border rounded-xl bg-white shadow-sm min-h-[400px]">
            <TiptapEditorWrapper
              initialContent={currentBioContent}
              onContentChange={handleContentChange}
              placeholder="당신의 SYDE를 자유롭게 표현해보세요."
              editable={true}
              onImageUpload={async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                const result = await uploadBioImage(formData);
                if (result.error) {
                  toast.error("이미지 업로드 실패: " + result.error);
                  return null;
                }
                return result.publicUrl || null;
              }}
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
              {/* SEO fallback */}
              {initialHtml && !isMounted && (
                <div className="prose prose-sm max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: initialHtml }} />
              )}
              {/* 클라이언트 사이드 Tiptap 로드 후 작동 */}
              <div className={cn(initialHtml && !isMounted ? "hidden" : "block")}>
                <TiptapViewer content={initialBio} />
              </div>
            </div>
          )}

          {/* Profile Link Badge */}
          {link && !isTiptapJsonEmpty(initialBio) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={link.startsWith('http') ? link : `https://${link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-white border border-[#B7B7B7] rounded-full text-[11px] font-bold text-sydeblue hover:bg-gray-50 transition-colors"
              >
                🔗 {link.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
              </a>
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


