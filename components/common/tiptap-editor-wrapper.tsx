"use client";

import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import type { EditorView } from "@tiptap/pm/view";
import { TextSelection } from "@tiptap/pm/state";
import { Fragment, Slice } from "@tiptap/pm/model";
import { undo } from "@tiptap/pm/history";
import { looksLikeMarkdown, pasteMarkdown, pastePlainText } from "./tiptap-markdown-paste";
import { commonTiptapExtensions } from "./tiptap-extensions";
import {
  UploadPlaceholder,
  addUploadPlaceholder,
  findUploadPlaceholder,
  removeUploadPlaceholder,
} from "./tiptap-upload-placeholder";
import TiptapToolbar from "./tiptap-toolbar";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageBubbleMenu, LinkPreviewBubbleMenu, TextBubbleMenu } from "./tiptap-bubble-menus";
import { toast } from "sonner";
import { upgradeToHttps } from "@/lib/utils";

interface TiptapEditorWrapperProps {
  initialContent: JSONContent | null;
  onContentChange: (json: JSONContent) => void;
  placeholder?: string;
  editable?: boolean;
  onImageUpload?: (file: File) => Promise<string | null>;
}

// Same shape the resize extension writes when a user centers an image; blog images read better centered.
const CENTERED_IMAGE_STYLE = "position: relative; margin: 0px auto;";

function toHttpUrl(text: string): string | null {
  if (/\s/.test(text)) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return upgradeToHttps(text) || text;
  } catch {
    return null;
  }
}

function getImageFiles(files: FileList | undefined | null): File[] {
  return Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
}

function pasteUrl(view: EditorView, url: string) {
  const { state } = view;
  const { selection, schema } = state;
  const linkMark = schema.marks.link.create({ href: url });

  if (!selection.empty) {
    view.dispatch(state.tr.addMark(selection.from, selection.to, linkMark));
    return;
  }

  const parent = selection.$from.parent;
  const isEmptyParagraph = parent.type.name === "paragraph" && parent.content.size === 0;
  if (isEmptyParagraph) {
    view.dispatch(
      state.tr.replaceSelectionWith(schema.nodes.linkPreview.create({ src: url })),
    );
    return;
  }

  view.dispatch(state.tr.replaceSelectionWith(schema.text(url, [linkMark]), false));
}

export default function TiptapEditorWrapper({
  initialContent,
  onContentChange,
  placeholder = "내용을 입력해주세요.",
  editable = true,
  onImageUpload,
}: TiptapEditorWrapperProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onImageUploadRef = useRef(onImageUpload);
  onImageUploadRef.current = onImageUpload;
  // Tracks the last JSON emitted so parent echoes of our own updates skip the resync effect.
  const lastEmittedRef = useRef<JSONContent | null>(null);

  const insertImageFilesRef = useRef<(view: EditorView, files: File[]) => void>(() => {});
  insertImageFilesRef.current = (view, files) => {
    const upload = onImageUploadRef.current;
    if (!upload || files.length === 0) return;

    const placeholderId = crypto.randomUUID();
    view.dispatch(addUploadPlaceholder(view.state.tr, placeholderId, view.state.selection.from, files.length));

    Promise.allSettled(files.map((file) => upload(file))).then((results) => {
      if (view.isDestroyed) return;
      const urls = results
        .map((result) => (result.status === "fulfilled" ? result.value : null))
        .filter((url): url is string => !!url)
        .map((url) => upgradeToHttps(url) || url);

      const { state } = view;
      // If the writer deleted the text around the placeholder, fall back to the caret rather than dropping the upload.
      const pos = findUploadPlaceholder(state, placeholderId) ?? state.selection.from;
      let tr = removeUploadPlaceholder(state.tr, placeholderId);
      if (urls.length > 0) {
        const nodes = urls.map((src) =>
          state.schema.nodes.imageResize.create({ src, containerStyle: CENTERED_IMAGE_STYLE }),
        );
        // A single slice keeps the images in order; replaceRange splits a paragraph if the upload started mid-text.
        // An empty line is consumed entirely so no stray blank paragraph is left behind.
        const $pos = tr.doc.resolve(pos);
        const onEmptyLine = $pos.parent.type.name === "paragraph" && $pos.parent.content.size === 0 && $pos.depth > 0;
        tr = onEmptyLine
          ? tr.replaceWith($pos.before(), $pos.after(), Fragment.from(nodes))
          : tr.replaceRange(pos, pos, new Slice(Fragment.from(nodes), 0, 0));
      }
      view.dispatch(tr);

      const failed = results.length - urls.length;
      if (failed === 0) return;
      const reason = results.find((r): r is PromiseRejectedResult => r.status === "rejected")?.reason?.message;
      toast.error(
        urls.length === 0
          ? reason || "이미지 업로드에 실패했습니다."
          : `${urls.length}장 삽입, ${failed}장 실패했습니다.${reason ? ` (${reason})` : ""}`,
      );
    });
  };

  const [linkOpen, setLinkOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...commonTiptapExtensions.map((extension) => {
        if (extension.name === "placeholder") {
          return extension.configure({
            placeholder: ({ node }: { node: { type: { name: string } } }) =>
              node.type.name === "imageCaption" ? "이미지 설명을 입력하세요 (선택)" : placeholder,
          });
        }
        return extension;
      }),
      UploadPlaceholder,
    ],
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none p-4 min-h-full",
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "k") {
          event.preventDefault();
          setLinkOpen(true);
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const images = getImageFiles(event.clipboardData?.files);
        if (images.length > 0) {
          insertImageFilesRef.current(view, images);
          return true;
        }

        const rawText = event.clipboardData?.getData("text/plain") ?? "";
        const text = rawText.trim();
        const url = text ? toHttpUrl(text) : null;
        if (url) {
          pasteUrl(view, url);
          return true;
        }

        if (text && looksLikeMarkdown(rawText, event.clipboardData?.getData("text/html"))) {
          pasteMarkdown(view, rawText);
          const docAfterPaste = view.state.doc;
          toast("마크다운 서식을 적용했어요", {
            action: {
              label: "원문 그대로",
              onClick: () => {
                if (view.isDestroyed || view.state.doc !== docAfterPaste) {
                  toast.info("이미 편집을 이어가서 되돌릴 수 없어요. 실행 취소를 이용해주세요.");
                  return;
                }
                undo(view.state, view.dispatch);
                pastePlainText(view, rawText);
              },
            },
          });
          return true;
        }
        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const images = getImageFiles(event.dataTransfer?.files);
        if (images.length === 0) return false;

        event.preventDefault();
        const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (dropPos) {
          const { state } = view;
          view.dispatch(state.tr.setSelection(TextSelection.near(state.doc.resolve(dropPos.pos))));
        }
        insertImageFilesRef.current(view, images);
        return true;
      },
    },
    content: initialContent || { type: "doc", content: [] },
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      lastEmittedRef.current = json;
      onContentChange(json);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (initialContent && initialContent === lastEmittedRef.current) return;

    const isContentSame =
      JSON.stringify(initialContent) === JSON.stringify(editor.getJSON());

    if (!isContentSame) {
      // The parent already holds this value; echoing it back would mark untouched forms as edited.
      // Kept out of undo history so undo can't wipe externally loaded content (e.g. a restored draft).
      editor
        .chain()
        .setMeta("addToHistory", false)
        .setContent(initialContent || { type: "doc", content: [] }, { emitUpdate: false })
        .run();
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const images = getImageFiles(event.target.files);
      if (editor && images.length > 0) {
        insertImageFilesRef.current(editor.view, images);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [editor],
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-[inherit] h-full">
      <TiptapToolbar
        editor={editor}
        onImageUploadClick={onImageUpload ? () => fileInputRef.current?.click() : undefined}
        linkOpen={linkOpen}
        onLinkOpenChange={setLinkOpen}
      />
      <TextBubbleMenu editor={editor} onLinkClick={() => setLinkOpen(true)} />
      <ImageBubbleMenu editor={editor} />
      <LinkPreviewBubbleMenu editor={editor} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
      />
      <div
        className="flex-1 cursor-text min-h-[inherit] h-full"
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
