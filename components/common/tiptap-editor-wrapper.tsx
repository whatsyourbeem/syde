"use client";

import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import { commonTiptapExtensions } from "./tiptap-extensions";
import TiptapToolbar from "./tiptap-toolbar";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { upgradeToHttps } from "@/lib/utils";

interface TiptapEditorWrapperProps {
  initialContent: JSONContent | null;
  onContentChange: (json: JSONContent) => void;
  placeholder?: string;
  editable?: boolean;
  onImageUpload?: (file: File) => Promise<string | null>;
}

export default function TiptapEditorWrapper({
  initialContent,
  onContentChange,
  placeholder = "내용을 입력해주세요.",
  editable = true,
  onImageUpload,
}: TiptapEditorWrapperProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: commonTiptapExtensions.map((extension) => {
      if (extension.name === "placeholder") {
        return extension.configure({ placeholder });
      }
      return extension;
    }),
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none p-4 min-h-full",
      },
      handlePaste: (view, event) => {
        // If there are files, don't try to handle it as a URL
        const file = event.clipboardData?.files?.[0];
        if (file && file.type.startsWith("image/")) {
          insertImageFile(file);
          return true;
        }

        const text = event.clipboardData?.getData("text/plain");
        if (text) {
          try {
            const url = new URL(text);
            if (url.protocol === "http:" || url.protocol === "https:") {
              // Upgrade HTTP to HTTPS for security
              const secureUrl = upgradeToHttps(text) || text;
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.linkPreview.create({
                    src: secureUrl,
                  }),
                ),
              );
              return true; // Mark as handled
            }
          } catch {
            // Not a valid URL, fall back to default paste behavior
          }
        }
        return false; // Use default paste behavior
      },
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            insertImageFile(file);
            return true;
          }
        }
        return false;
      },
    },
    content: initialContent || { type: "doc", content: [] },
    editable,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getJSON();
    const isContentSame =
      JSON.stringify(initialContent) === JSON.stringify(currentContent);

    if (!isContentSame) {
      editor.commands.setContent(
        initialContent || { type: "doc", content: [] },
      );
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertImageFile = useCallback(
    async (file: File) => {
      if (!file || !onImageUpload || !editor) return;

      const promise = onImageUpload(file);

      toast.promise(promise, {
        loading: "이미지를 업로드하는 중입니다...",
        success: (publicUrl) => {
          if (publicUrl && editor) {
            // Ensure HTTPS for security
            const secureUrl = upgradeToHttps(publicUrl) || publicUrl;
            editor.chain().focus().setImage({ src: secureUrl }).run();
            return "이미지가 성공적으로 삽입되었습니다.";
          }
          return "업로드되었으나 URL이 유효하지 않습니다.";
        },
        error: (err) => {
          // If it's the size error we threw, we can show it directly
          return `${err.message}`;
        },
      });
    },
    [editor, onImageUpload],
  );

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        insertImageFile(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [insertImageFile],
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-[inherit] h-full">
      <TiptapToolbar
        editor={editor}
        onImageUploadClick={() => fileInputRef.current?.click()}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
      />
      <div 
        className="flex-1 max-h-[60vh] overflow-y-auto cursor-text min-h-[inherit] h-full"
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
