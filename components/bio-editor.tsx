"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { updateBio } from "@/app/[username]/actions"; // will create this server action
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Import cn utility

interface BioEditorProps {
  initialBio: string | null;
  isOwnProfile: boolean;
  profileId: string;
}

const TiptapEditor = ({ editor }: { editor: any }) => {
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isStrikeActive, setIsStrikeActive] = useState(false);
  const [isCodeActive, setIsCodeActive] = useState(false);
  const [isCodeBlockActive, setIsCodeBlockActive] = useState(false);
  const [isBlockquoteActive, setIsBlockquoteActive] = useState(false);
  const [isBulletListActive, setIsBulletListActive] = useState(false);
  const [isOrderedListActive, setIsOrderedListActive] = useState(false);
  const [isHeading1Active, setIsHeading1Active] = useState(false);
  const [isHeading2Active, setIsHeading2Active] = useState(false);
  const [isHeading3Active, setIsHeading3Active] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateActiveStates = () => {
      setIsBoldActive(editor.isActive("bold"));
      setIsItalicActive(editor.isActive("italic"));
      setIsStrikeActive(editor.isActive("strike"));
      setIsCodeActive(editor.isActive("code"));
      setIsCodeBlockActive(editor.isActive("codeBlock"));
      setIsBlockquoteActive(editor.isActive("blockquote"));
      setIsBulletListActive(editor.isActive("bulletList"));
      setIsOrderedListActive(editor.isActive("orderedList"));
      setIsHeading1Active(editor.isActive("heading", { level: 1 }));
      setIsHeading2Active(editor.isActive("heading", { level: 2 }));
      setIsHeading3Active(editor.isActive("heading", { level: 3 }));
    };

    // Initial update
    updateActiveStates();

    // Subscribe to selection updates
    editor.on("selectionUpdate", updateActiveStates);
    editor.on("update", updateActiveStates); // Also listen to general updates

    // Cleanup subscription
    return () => {
      editor.off("selectionUpdate", updateActiveStates);
      editor.off("update", updateActiveStates);
    };
  }, [editor]);

  return (
    <div className="prose max-w-none">
      {editor && (
        <div className="flex flex-wrap gap-1 mb-2">
          <Button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            variant={isBoldActive ? "default" : "outline"}
            size="sm"
          >
            Bold
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            variant={isItalicActive ? "default" : "outline"}
            size="sm"
          >
            Italic
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            variant={isStrikeActive ? "default" : "outline"}
            size="sm"
          >
            Strike
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            variant={isCodeActive ? "default" : "outline"}
            size="sm"
          >
            Code
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
            variant={isCodeBlockActive ? "default" : "outline"}
            size="sm"
          >
            Code Block
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={!editor.can().chain().focus().toggleBlockquote().run()}
            variant={isBlockquoteActive ? "default" : "outline"}
            size="sm"
          >
            Blockquote
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={!editor.can().chain().focus().toggleBulletList().run()}
            variant={isBulletListActive ? "default" : "outline"}
            size="sm"
          >
            Bullet List
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={!editor.can().chain().focus().toggleOrderedList().run()}
            variant={isOrderedListActive ? "default" : "outline"}
            size="sm"
          >
            Ordered List
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run()}
            variant={isHeading1Active ? "default" : "outline"}
            size="sm"
          >
            H1
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
            variant={isHeading2Active ? "default" : "outline"}
            size="sm"
          >
            H2
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()}
            variant={isHeading3Active ? "default" : "outline"}
            size="sm"
          >
            H3
          </Button>
          <Button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={!editor.can().chain().focus().setHorizontalRule().run()}
            variant="outline"
            size="sm"
          >
            HR
          </Button>
          <Button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            variant="outline"
            size="sm"
          >
            Undo
          </Button>
          <Button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            variant="outline"
            size="sm"
          >
            Redo
          </Button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default function BioEditor({
  initialBio,
  isOwnProfile,
  profileId,
}: BioEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: "자유 소개를 작성해주세요...",
      }),
    ],
    content: initialBio || "",
    editable: isEditing,
    onUpdate: ({ editor }) => {
      // No longer updating selectionKey here
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  useEffect(() => {
    if (editor && initialBio !== editor.getHTML()) {
      editor.commands.setContent(initialBio || "");
    }
  }, [editor, initialBio]);

  const handleSave = useCallback(async () => {
    if (!editor) return;

    setIsLoading(true);
    const content = editor.getHTML();
    const { error } = await updateBio(profileId, content); // Call server action

    if (error) {
      toast.error("자유 소개 저장 실패", {
        description: error.message,
      });
    } else {
      toast.success("자유 소개 저장 완료");
      setIsEditing(false);
    }
    setIsLoading(false);
  }, [editor, profileId]);

  const handleCancel = useCallback(() => {
    if (editor) {
      editor.commands.setContent(initialBio || ""); // Revert to initial content
    }
    setIsEditing(false);
  }, [editor, initialBio]);

  if (!editor) {
    return null;
  }

  return (
    <div className="mt-4 p-4 border rounded-lg bg-card">
      {isEditing ? (
        <>
          <TiptapEditor editor={editor} />
          <div className="mt-4 flex justify-end space-x-2">
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
          {initialBio && initialBio !== "<p></p>" ? (
            <div
              className="prose max-w-none text-muted-foreground whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: initialBio }}
            />
          ) : (
            <p className="text-muted-foreground text-center">
              {isOwnProfile
                ? "자유 소개를 작성해주세요."
                : "작성된 자유 소개가 없습니다."}
            </p>
          )}
          {isOwnProfile && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setIsEditing(true)}>수정</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
