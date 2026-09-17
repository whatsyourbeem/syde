"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection } from "@tiptap/pm/state";
import { Code, Link2, Captions } from "lucide-react";
import { cn } from "@/lib/utils";

const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

function BubbleButton({
  active,
  onClick,
  label,
  className,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // Keep the editor selection alive; a normal mousedown would blur the editor and hide the menu.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm text-white/90 hover:bg-white/15",
        active && "bg-white/20 text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TextBubbleMenu({ editor, onLinkClick }: { editor: Editor; onLinkClick: () => void }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      link: editor.isActive("link"),
    }),
  });

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="textBubbleMenu"
      // A custom shouldShow replaces Tiptap's default, which is what normally hides the menu once the editor loses focus.
      shouldShow={({ editor, view, state: editorState, from, to }) =>
        editor.isEditable &&
        view.hasFocus() &&
        from !== to &&
        !(editorState.selection instanceof NodeSelection) &&
        !editor.isActive("codeBlock") &&
        editorState.doc.textBetween(from, to).trim().length > 0
      }
      // On touch devices the OS selection callout sits above the text, so open below it.
      options={{ placement: isTouch ? "bottom" : "top", offset: 8 }}
      className="z-40 flex items-center gap-0.5 rounded-lg bg-neutral-900 p-1 shadow-lg"
    >
      <BubbleButton label="굵게" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} className="font-bold">
        B
      </BubbleButton>
      <BubbleButton label="기울임" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} className="italic font-serif">
        I
      </BubbleButton>
      <BubbleButton label="밑줄" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} className="underline">
        U
      </BubbleButton>
      <BubbleButton label="취소선" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()} className="line-through">
        S
      </BubbleButton>
      <BubbleButton label="인라인 코드" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code size={15} />
      </BubbleButton>
      <div className="mx-0.5 h-5 border-l border-white/20" />
      <BubbleButton label="링크" active={state.link} onClick={onLinkClick}>
        <Link2 size={15} />
      </BubbleButton>
    </BubbleMenu>
  );
}

export function ImageBubbleMenu({ editor }: { editor: Editor }) {
  const addOrFocusCaption = () => {
    const { selection } = editor.state;
    if (!(selection instanceof NodeSelection)) return;
    const after = selection.to;
    const next = editor.state.doc.nodeAt(after);
    if (next?.type.name === "imageCaption") {
      editor.chain().focus().setTextSelection(after + 1 + next.content.size).run();
      return;
    }
    editor
      .chain()
      .focus()
      .insertContentAt(after, { type: "imageCaption" })
      .setTextSelection(after + 1)
      .run();
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageBubbleMenu"
      shouldShow={({ editor, view, state }) =>
        editor.isEditable &&
        view.hasFocus() &&
        state.selection instanceof NodeSelection &&
        state.selection.node.type.name === "imageResize"
      }
      options={{ placement: "bottom", offset: 8 }}
      className="z-40 flex items-center gap-0.5 rounded-lg bg-neutral-900 p-1 shadow-lg"
    >
      <BubbleButton label="이미지 설명(캡션) 추가" onClick={addOrFocusCaption} className="gap-1.5 px-3">
        <Captions size={15} /> 캡션
      </BubbleButton>
    </BubbleMenu>
  );
}
