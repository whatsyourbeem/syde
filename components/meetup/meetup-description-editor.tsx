"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  List,
  ListOrdered,
  Quote,
  Code,
  SquareMinus,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { uploadMeetupDescriptionImage } from "@/app/meetup/actions";
import { toast } from "sonner";

interface MeetupDescriptionEditorProps {
  initialDescription: string | null;
  onDescriptionChange: (html: string) => void;
  meetupId: string;
}

const TiptapEditor = ({
  editor,
  meetupId,
}: {
  editor: any;
  meetupId: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImageSelected, setIsImageSelected] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateActiveStates = () => {
      setIsImageSelected(editor.isActive("image"));
    };

    updateActiveStates();
    editor.on("selectionUpdate", updateActiveStates);
    editor.on("update", updateActiveStates);

    return () => {
      editor.off("selectionUpdate", updateActiveStates);
      editor.off("update", updateActiveStates);
    };
  }, [editor]);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !meetupId) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("meetupId", meetupId);

      const promise = uploadMeetupDescriptionImage(formData);

      toast.promise(promise, {
        loading: "이미지를 업로드하는 중입니다...",
        success: (data) => {
          if (data.error) {
            throw new Error(data.error);
          }
          if (data.publicUrl) {
            editor.chain().focus().setImage({ src: data.publicUrl }).run();
          }
          return "이미지가 성공적으로 삽입되었습니다.";
        },
        error: (err) => `이미지 업로드 실패: ${err.message}`,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [editor, meetupId]
  );

  const setImageSize = (size: string | null) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .updateAttributes("image", { style: size ? `width: ${size}` : null })
        .run();
    }
  };

  if (!editor) return null;

  return (
    <div className="prose max-w-none">
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex flex-wrap gap-1 items-center">
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            variant={editor.isActive("bold") ? "default" : "outline"}
            size="sm"
            className="font-bold text-base"
          >
            B
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            variant={editor.isActive("italic") ? "default" : "outline"}
            size="sm"
            className="italic text-base font-serif"
          >
            I
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            variant={editor.isActive("strike") ? "default" : "outline"}
            size="sm"
            className="line-through text-base"
          >
            S
          </Button>
          <div className="border-l h-6 mx-2"></div>
          <Button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            variant={
              editor.isActive({ textAlign: "left" }) ? "default" : "outline"
            }
            size="sm"
          >
            <AlignLeft size={16} />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            variant={
              editor.isActive({ textAlign: "center" }) ? "default" : "outline"
            }
            size="sm"
          >
            <AlignCenter size={16} />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            variant={
              editor.isActive({ textAlign: "right" }) ? "default" : "outline"
            }
            size="sm"
          >
            <AlignRight size={16} />
          </Button>
          <div className="border-l h-6 mx-2"></div>
          <Button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            disabled={
              !editor.can().chain().focus().toggleHeading({ level: 1 }).run()
            }
            variant={
              editor.isActive("heading", { level: 1 }) ? "default" : "outline"
            }
            size="sm"
          >
            H1
          </Button>
          <Button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            disabled={
              !editor.can().chain().focus().toggleHeading({ level: 2 }).run()
            }
            variant={
              editor.isActive("heading", { level: 2 }) ? "default" : "outline"
            }
            size="sm"
          >
            H2
          </Button>
          <Button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            disabled={
              !editor.can().chain().focus().toggleHeading({ level: 3 }).run()
            }
            variant={
              editor.isActive("heading", { level: 3 }) ? "default" : "outline"
            }
            size="sm"
          >
            H3
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 items-center justify-between">
          <div className="flex flex-wrap gap-1 items-center">
            <Button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
              variant={editor.isActive("codeBlock") ? "default" : "outline"}
              size="sm"
              className="flex items-center justify-center"
            >
              <Code size={16} />
            </Button>
            <Button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              disabled={!editor.can().chain().focus().toggleBlockquote().run()}
              variant={editor.isActive("blockquote") ? "default" : "outline"}
              size="sm"
              className="flex items-center justify-center"
            >
              <Quote size={10} />
            </Button>
            <Button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={!editor.can().chain().focus().toggleBulletList().run()}
              variant={editor.isActive("bulletList") ? "default" : "outline"}
              size="sm"
              className="flex items-center justify-center"
            >
              <List size={16} />
            </Button>
            <Button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              disabled={!editor.can().chain().focus().toggleOrderedList().run()}
              variant={editor.isActive("orderedList") ? "default" : "outline"}
              size="sm"
              className="flex items-center justify-center"
            >
              <ListOrdered size={16} />
            </Button>
            <Button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              disabled={!editor.can().chain().focus().setHorizontalRule().run()}
              variant="outline"
              size="sm"
              className="flex items-center justify-center"
            >
              <SquareMinus size={16} />
            </Button>
            <div className="border-l h-6 mx-2"></div>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
            >
              <ImageIcon size={16} />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
          </div>

          <div className="flex flex-wrap gap-1 items-center">
            {isImageSelected && (
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium mr-1">이미지 크기:</span>
                <Button
                  type="button"
                  onClick={() => setImageSize("25%")}
                  variant="outline"
                  size="sm"
                >
                  작게
                </Button>
                <Button
                  type="button"
                  onClick={() => setImageSize("50%")}
                  variant="outline"
                  size="sm"
                >
                  중간
                </Button>
                <Button
                  type="button"
                  onClick={() => setImageSize("100%")}
                  variant="outline"
                  size="sm"
                >
                  크게
                </Button>
                <Button
                  type="button"
                  onClick={() => setImageSize(null)}
                  variant="outline"
                  size="sm"
                >
                  원본
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default function MeetupDescriptionEditor({
  initialDescription,
  onDescriptionChange,
  meetupId,
}: MeetupDescriptionEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: "모임 상세 설명을 작성해주세요.",
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
            },
          };
        },
      }),
    ],
    content: initialDescription === "<p></p>" ? "" : initialDescription || "",
    onUpdate: ({ editor }) => {
      onDescriptionChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialDescription !== editor.getHTML()) {
      editor.commands.setContent(initialDescription || "");
    }
  }, [editor, initialDescription]);

  if (!editor) {
    return null;
  }

  return (
    <div className="my-4 p-4 border rounded-lg bg-card">
      <TiptapEditor editor={editor} meetupId={meetupId} />
    </div>
  );
}
