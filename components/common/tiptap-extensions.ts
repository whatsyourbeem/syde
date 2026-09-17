import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { LinkPreview } from "./tiptap-link-preview";
import { CodeBlock } from "./tiptap-code-block";
import { ImageCaption } from "./tiptap-image-caption";

import TextAlign from "@tiptap/extension-text-align";
import ResizeImage from "tiptap-extension-resize-image";

export const commonTiptapExtensions = [
  StarterKit.configure({
    codeBlock: false,
    link: {
      // While editing, clicking a link should place the caret, not navigate away.
      openOnClick: false,
      autolink: true,
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
];
