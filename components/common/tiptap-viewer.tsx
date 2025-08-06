"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { commonTiptapExtensions } from "./tiptap-extensions";
import { useEffect } from "react";
import { Json } from "@/types/database.types";
import { isTiptapJsonEmpty } from "@/lib/utils";

interface TiptapViewerProps {
  content: Json | null;
  placeholder?: string;
}

export default function TiptapViewer({ content, placeholder = "작성된 내용이 없습니다." }: TiptapViewerProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: commonTiptapExtensions.map(extension => {
      if (extension.name === 'placeholder') {
        return extension.configure({ placeholder });
      }
      return extension;
    }),
    content: content as object | undefined,
    editable: false, // Make the editor read-only
  });

  useEffect(() => {
    if (!editor) return;

    if (content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content as object | null);
    } else if (!content || isTiptapJsonEmpty(content)) {
      if (!isTiptapJsonEmpty(editor.getJSON())) {
        editor.commands.setContent("");
      }
    }
  }, [editor, content]);

  if (!editor) {
    return null;
  }

  return (
    <div className="prose max-w-none text-muted-foreground">
      <EditorContent editor={editor} />
    </div>
  );
}
