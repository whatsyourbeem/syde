"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection } from "@tiptap/pm/state";
import { Code, Link2, Captions, Trash2, ExternalLink, TextCursorInput, Rows3, Columns3 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const BUBBLE_CLASS = "z-40 flex items-center gap-0.5 rounded-lg bg-neutral-900 p-1 shadow-lg";
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
      className={BUBBLE_CLASS}
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


function selectedNode(editor: Editor, typeName: string) {
  const { selection } = editor.state;
  return selection instanceof NodeSelection && selection.node.type.name === typeName ? selection : null;
}

export function ImageBubbleMenu({ editor }: { editor: Editor }) {
  const [editingAlt, setEditingAlt] = useState(false);
  const [altValue, setAltValue] = useState("");
  const selectedPos = useEditorState({
    editor,
    selector: ({ editor }) => selectedNode(editor, "imageResize")?.from ?? null,
  });

  // Selecting a different image (or none) leaves alt-text editing.
  useEffect(() => {
    setEditingAlt(false);
  }, [selectedPos]);

  const addOrFocusCaption = () => {
    const selection = selectedNode(editor, "imageResize");
    if (!selection) return;
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

  const startAlt = () => {
    const selection = selectedNode(editor, "imageResize");
    setAltValue((selection?.node.attrs.alt as string | null) ?? "");
    setEditingAlt(true);
  };

  const saveAlt = () => {
    const pos = selectedPos;
    if (pos === null) return;
    editor
      .chain()
      .command(({ tr }) => {
        tr.setNodeAttribute(pos, "alt", altValue.trim() || null);
        return true;
      })
      .setNodeSelection(pos)
      .focus()
      .run();
    setEditingAlt(false);
  };

  const remove = () => {
    // The caption belongs to the image; delete it along with it.
    const selection = selectedNode(editor, "imageResize");
    if (!selection) return;
    const next = editor.state.doc.nodeAt(selection.to);
    const to = next?.type.name === "imageCaption" ? selection.to + next.nodeSize : selection.to;
    editor.chain().focus().deleteRange({ from: selection.from, to }).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageBubbleMenu"
      shouldShow={({ editor, view, state, element }) =>
        editor.isEditable &&
        // Keep showing while the alt-text input inside the menu has focus.
        (view.hasFocus() || element.contains(document.activeElement)) &&
        state.selection instanceof NodeSelection &&
        state.selection.node.type.name === "imageResize"
      }
      options={{ placement: "bottom", offset: 8 }}
      className={BUBBLE_CLASS}
    >
      {editingAlt ? (
        <form
          className="flex items-center gap-1 p-0.5"
          onSubmit={(e) => {
            e.preventDefault();
            saveAlt();
          }}
        >
          <input
            autoFocus
            value={altValue}
            onChange={(e) => setAltValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                saveAlt();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setEditingAlt(false);
                editor.commands.focus();
              }
            }}
            placeholder="이미지를 설명하는 짧은 문장"
            aria-label="대체 텍스트"
            className="h-8 w-56 rounded-md bg-white/10 px-2 text-[16px] md:text-sm text-white placeholder:text-white/40 outline-none"
          />
          <button type="submit" className="h-8 rounded-md bg-white px-3 text-sm font-medium text-neutral-900">
            저장
          </button>
        </form>
      ) : (
        <>
          <BubbleButton label="이미지 설명(캡션) 추가" onClick={addOrFocusCaption} className="gap-1.5 px-3">
            <Captions size={15} /> 캡션
          </BubbleButton>
          <BubbleButton label="대체 텍스트 (화면 낭독기·검색용 이미지 설명)" onClick={startAlt} className="gap-1.5 px-3">
            <TextCursorInput size={15} /> 대체 텍스트
          </BubbleButton>
          <div className="mx-0.5 h-5 border-l border-white/20" />
          <BubbleButton label="이미지 삭제" onClick={remove} className="text-red-300 hover:text-red-200">
            <Trash2 size={15} />
          </BubbleButton>
        </>
      )}
    </BubbleMenu>
  );
}

export function LinkPreviewBubbleMenu({ editor }: { editor: Editor }) {
  const toLink = () => {
    const selection = selectedNode(editor, "linkPreview");
    if (!selection) return;
    const url = selection.node.attrs.src as string;
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: selection.from, to: selection.to },
        { type: "paragraph", content: [{ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] }] },
      )
      .run();
  };

  const open = () => {
    const url = selectedNode(editor, "linkPreview")?.node.attrs.src as string | undefined;
    if (url && /^https?:\/\//i.test(url)) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="linkPreviewBubbleMenu"
      shouldShow={({ editor, view, state }) =>
        editor.isEditable &&
        view.hasFocus() &&
        state.selection instanceof NodeSelection &&
        state.selection.node.type.name === "linkPreview"
      }
      options={{ placement: "bottom", offset: 8 }}
      className={BUBBLE_CLASS}
    >
      <BubbleButton label="새 탭에서 열기" onClick={open} className="gap-1.5 px-3">
        <ExternalLink size={15} /> 열기
      </BubbleButton>
      <BubbleButton label="카드를 일반 링크로 바꾸기" onClick={toLink} className="gap-1.5 px-3">
        <Link2 size={15} /> 링크로 바꾸기
      </BubbleButton>
      <div className="mx-0.5 h-5 border-l border-white/20" />
      <BubbleButton label="카드 삭제" onClick={() => editor.chain().focus().deleteSelection().run()} className="text-red-300 hover:text-red-200">
        <Trash2 size={15} />
      </BubbleButton>
    </BubbleMenu>
  );
}

export function TableBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubbleMenu"
      // Only when the caret merely sits in a cell, not while text is selected — a text selection shows
      // TextBubbleMenu instead, and showing both at once would stack two menus on top of each other.
      shouldShow={({ editor, view, state }) => editor.isEditable && view.hasFocus() && state.selection.empty && editor.isActive("table")}
      options={{ placement: "top", offset: 8 }}
      className={BUBBLE_CLASS}
    >
      <BubbleButton label="아래에 행 추가" onClick={() => editor.chain().focus().addRowAfter().run()} className="gap-1.5 px-3">
        <Rows3 size={15} /> 행
      </BubbleButton>
      <BubbleButton label="오른쪽에 열 추가" onClick={() => editor.chain().focus().addColumnAfter().run()} className="gap-1.5 px-3">
        <Columns3 size={15} /> 열
      </BubbleButton>
      <div className="mx-0.5 h-5 border-l border-white/20" />
      <BubbleButton label="현재 행 삭제" onClick={() => editor.chain().focus().deleteRow().run()} className="gap-1.5 px-3 text-red-300 hover:text-red-200">
        <Rows3 size={15} /> 행 삭제
      </BubbleButton>
      <BubbleButton label="현재 열 삭제" onClick={() => editor.chain().focus().deleteColumn().run()} className="gap-1.5 px-3 text-red-300 hover:text-red-200">
        <Columns3 size={15} /> 열 삭제
      </BubbleButton>
      <div className="mx-0.5 h-5 border-l border-white/20" />
      <BubbleButton label="표 삭제" onClick={() => editor.chain().focus().deleteTable().run()} className="text-red-300 hover:text-red-200">
        <Trash2 size={15} />
      </BubbleButton>
    </BubbleMenu>
  );
}
