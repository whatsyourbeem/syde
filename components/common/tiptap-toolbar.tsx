"use client";

import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
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

interface TiptapToolbarProps {
  editor: Editor;
  onImageUploadClick?: () => void;
}

export default function TiptapToolbar({
  editor,
  onImageUploadClick,
}: TiptapToolbarProps) {
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isStrikeActive, setIsStrikeActive] = useState(false);
  const [isCodeBlockActive, setIsCodeBlockActive] = useState(false);
  const [isBlockquoteActive, setIsBlockquoteActive] = useState(false);
  const [isBulletListActive, setIsBulletListActive] = useState(false);
  const [isOrderedListActive, setIsOrderedListActive] = useState(false);
  const [isHeading1Active, setIsHeading1Active] = useState(false);
  const [isHeading2Active, setIsHeading2Active] = useState(false);
  const [isHeading3Active, setIsHeading3Active] = useState(false);
  const [isAlignLeftActive, setIsAlignLeftActive] = useState(false);
  const [isAlignCenterActive, setIsAlignCenterActive] = useState(false);
  const [isAlignRightActive, setIsAlignRightActive] = useState(false);
  useEffect(() => {
    if (!editor) return;

    const updateActiveStates = () => {
      setIsBoldActive(editor.isActive("bold"));
      setIsItalicActive(editor.isActive("italic"));
      setIsStrikeActive(editor.isActive("strike"));
      setIsCodeBlockActive(editor.isActive("codeBlock"));
      setIsBlockquoteActive(editor.isActive("blockquote"));
      setIsBulletListActive(editor.isActive("bulletList"));
      setIsOrderedListActive(editor.isActive("orderedList"));
      setIsHeading1Active(editor.isActive("heading", { level: 1 }));
      setIsHeading2Active(editor.isActive("heading", { level: 2 }));
      setIsHeading3Active(editor.isActive("heading", { level: 3 }));
      setIsAlignLeftActive(editor.isActive({ textAlign: "left" }));
      setIsAlignCenterActive(editor.isActive({ textAlign: "center" }));
      setIsAlignRightActive(editor.isActive({ textAlign: "right" }));
      // Removed setIsImageSelected(editor.isActive("image"));
    };

    updateActiveStates();
    editor.on("selectionUpdate", updateActiveStates);
    editor.on("update", updateActiveStates);

    return () => {
      editor.off("selectionUpdate", updateActiveStates);
      editor.off("update", updateActiveStates);
    };
  }, [editor]);

  return (
    <div className="flex flex-col gap-2 mb-2">
      <div className="flex flex-wrap gap-1 items-center">
        {/* Text formatting buttons */}
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          variant={isBoldActive ? "default" : "outline"}
          size="sm"
          className="font-bold text-base"
        >
          B
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          variant={isItalicActive ? "default" : "outline"}
          size="sm"
          className="italic text-base font-serif"
        >
          I
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          variant={isStrikeActive ? "default" : "outline"}
          size="sm"
          className="line-through text-base"
        >
          S
        </Button>
        <div className="border-l h-6 mx-2"></div>
        {/* Text alignment buttons */}
        <Button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          variant={isAlignLeftActive ? "default" : "outline"}
          size="sm"
        >
          <AlignLeft size={16} />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          variant={isAlignCenterActive ? "default" : "outline"}
          size="sm"
        >
          <AlignCenter size={16} />
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          variant={isAlignRightActive ? "default" : "outline"}
          size="sm"
        >
          <AlignRight size={16} />
        </Button>
        <div className="border-l h-6 mx-2"></div>
        {/* Heading buttons */}
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run()}
          variant={isHeading1Active ? "default" : "outline"}
          size="sm"
        >
          H1
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
          variant={isHeading2Active ? "default" : "outline"}
          size="sm"
        >
          H2
        </Button>
        <Button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()}
          variant={isHeading3Active ? "default" : "outline"}
          size="sm"
        >
          H3
        </Button>
      </div>
      <div className="flex flex-wrap gap-1 items-center justify-between">
        <div className="flex flex-wrap gap-1 items-center">
          {/* Other buttons */}
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
            variant={isCodeBlockActive ? "default" : "outline"}
            size="sm"
            className="flex items-center justify-center"
          >
            <Code size={16} />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={!editor.can().chain().focus().toggleBlockquote().run()}
            variant={isBlockquoteActive ? "default" : "outline"}
            size="sm"
            className="flex items-center justify-center"
          >
            <Quote size={10} />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={!editor.can().chain().focus().toggleBulletList().run()}
            variant={isBulletListActive ? "default" : "outline"}
            size="sm"
            className="flex items-center justify-center"
          >
            <List size={16} />
          </Button>
          <Button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={!editor.can().chain().focus().toggleOrderedList().run()}
            variant={isOrderedListActive ? "default" : "outline"}
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
          {onImageUploadClick && (
            <>
              <div className="border-l h-6 mx-2"></div>
              <Button
                type="button"
                onClick={onImageUploadClick}
                variant="outline"
                size="sm"
              >
                <ImageIcon size={16} />
              </Button>
            </>
          )}
        </div>

        
      </div>
    </div>
  );
}
