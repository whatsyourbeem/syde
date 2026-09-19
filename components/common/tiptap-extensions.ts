import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import Youtube from "@tiptap/extension-youtube";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { LinkPreview } from "./tiptap-link-preview";
import { CodeBlock } from "./tiptap-code-block";
import { ImageCaption } from "./tiptap-image-caption";
import { Callout } from "./tiptap-callout";
import { shouldAutoLink } from "./tiptap-link-autolink";
import { SlashCommand } from "./tiptap-slash-command";

import TextAlign from "@tiptap/extension-text-align";
import ResizeImage from "tiptap-extension-resize-image";

export const commonTiptapExtensions = [
  StarterKit.configure({
    codeBlock: false,
    link: {
      // While editing, clicking a link should place the caret, not navigate away.
      openOnClick: false,
      autolink: true,
      shouldAutoLink,
    },
  }),
  CodeBlock,
  LinkPreview,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Placeholder.configure({
    placeholder: "내용을 입력해주세요.",
  }),
  ResizeImage.configure({
    inline: false,
    allowBase64: false,
  }),
  ImageCaption,
  TableKit.configure({
    table: { resizable: true },
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Youtube.configure({
    // Our own paste handler (tiptap-editor-wrapper.tsx) already detects YouTube URLs and normalizes
    // them before inserting; the extension's own paste-rule regex mis-parses /shorts/ URLs.
    addPasteHandler: false,
    width: 640,
    height: 360,
  }),
  Highlight.configure({ multicolor: true }),
  TextStyle,
  Color,
  Callout,
  SlashCommand,
];
