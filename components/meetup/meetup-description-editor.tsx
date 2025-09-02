"use client";

import { JSONContent } from "@tiptap/react";
import TiptapEditorWrapper from "@/components/common/tiptap-editor-wrapper";

interface MeetupDescriptionEditorProps {
  initialDescription: JSONContent | null;
  onDescriptionChange: (json: JSONContent) => void;
  onImageAdded: (file: File, blobUrl: string) => void;
}

export default function MeetupDescriptionEditor({
  initialDescription,
  onDescriptionChange,
  onImageAdded,
}: MeetupDescriptionEditorProps) {

  return (
    <div className="my-4 p-4 border rounded-lg bg-card">
      <TiptapEditorWrapper
        initialContent={initialDescription}
        onContentChange={onDescriptionChange}
        placeholder="모임 상세 설명을 작성해주세요."
        editable={true}
        onImageUpload={async (file) => {
          // Don't upload here. Create a local URL for preview.
          const blobUrl = URL.createObjectURL(file);
          // Pass the file and its blob URL to the parent component.
          onImageAdded(file, blobUrl);
          // Return the blob URL to Tiptap for display.
          return blobUrl;
        }}
      />
    </div>
  );
}
