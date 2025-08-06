"use client";

import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { updateBio, uploadBioImage } from "@/app/[username]/actions";
import { toast } from "sonner";
import TiptapViewer from "@/components/common/tiptap-viewer";
import { Json } from "@/types/database.types";
import { isTiptapJsonEmpty } from "@/lib/utils";
import { JSONContent } from "@tiptap/react";
import TiptapEditorWrapper from "@/components/common/tiptap-editor-wrapper";

interface BioEditorProps {
  initialBio: Json | null;
  isOwnProfile: boolean;
}

export default function BioEditor({
  initialBio,
  isOwnProfile,
}: BioEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBioContent, setCurrentBioContent] = useState<JSONContent | null>(initialBio as JSONContent | null);

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
      setIsEditing(false);
    }
    setIsLoading(false);
  }, [currentBioContent]);

  const handleCancel = useCallback(() => {
    setCurrentBioContent(initialBio as JSONContent | null);
    setIsEditing(false);
  }, [initialBio]);

  const handleContentChange = useCallback((json: JSONContent) => {
    setCurrentBioContent(json);
  }, []);

  return (
    <div>
      {isEditing ? (
        <>
          <div className="my-4 p-4 border rounded-lg bg-card">
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
          <div className="mt-4 flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col">
          {isTiptapJsonEmpty(initialBio) ? (
            <p className="m-4 p-4 text-muted-foreground text-center">
              {isOwnProfile
                ? "자유 소개를 작성해주세요."
                : "작성된 자유 소개가 없습니다."}
            </p>
          ) : (
            <TiptapViewer content={initialBio} />
          )}
          {isOwnProfile && (
            <div className="mt-4 flex justify-center">
              <Button onClick={() => setIsEditing(true)}>수정</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
