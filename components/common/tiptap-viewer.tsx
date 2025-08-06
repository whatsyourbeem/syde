"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

import { Json } from "@/types/database.types";

interface TiptapViewerProps {
  content: Json | null;
}

export default function TiptapViewer({ content }: TiptapViewerProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: "작성된 자유 소개가 없습니다.",
      }),
    ],
    content: content as object | undefined,
    editable: false, // Make the editor read-only
  });

  useEffect(() => {
    if (editor && content) {
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
        editor.commands.setContent(content as object | null);
      }
    } else if (editor && content === null) {
      if (editor.getHTML() !== "") {
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
