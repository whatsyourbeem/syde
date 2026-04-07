import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { LinkPreview } from "./tiptap-link-preview";

import TextAlign from "@tiptap/extension-text-align";
import ResizeImage from "tiptap-extension-resize-image";

export const commonTiptapExtensions = [
  StarterKit.configure({
    link: {
      openOnClick: true,
      autolink: true,
    },
  }),
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
];
