"use client";

import { uploadMeetupDescriptionImage } from "@/app/socialing/actions";
import { toast } from "sonner";
import { JSONContent } from "@tiptap/react";
import TiptapEditorWrapper from "@/components/common/tiptap-editor-wrapper";

interface MeetupDescriptionEditorProps {
  initialDescription: JSONContent | null;
  onDescriptionChange: (json: JSONContent) => void;
  meetupId: string;
}

export default function MeetupDescriptionEditor({
  initialDescription,
  onDescriptionChange,
  meetupId,
}: MeetupDescriptionEditorProps) {

  return (
    <div className="my-4 p-4 border rounded-lg bg-card">
      <TiptapEditorWrapper
        initialContent={initialDescription}
        onContentChange={onDescriptionChange}
        placeholder="모임 상세 설명을 작성해주세요."
        editable={true}
        onImageUpload={async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("meetupId", meetupId);
          const result = await uploadMeetupDescriptionImage(formData);
          if (result.error) {
            toast.error("이미지 업로드 실패: " + result.error);
            return null;
          }
          return result.publicUrl || null;
        }}
      />
    </div>
  );
}
