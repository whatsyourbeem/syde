import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { LinkPreview } from "./tiptap-link-preview";

import TextAlign from "@tiptap/extension-text-align";
import ResizeImage from "tiptap-extension-resize-image"; // Import ResizeImage

export const commonTiptapExtensions = [
  StarterKit,
  LinkPreview,
  TextAlign.configure({
    types: ["heading", "paragraph"], // Keep this for text alignment
  }),
  Link.configure({
    openOnClick: true,
    autolink: true,
  }),
  Placeholder.configure({
    placeholder: "내용을 입력해주세요.", // Generic placeholder
  }),
  // Replace CustomImage with ResizeImage
  ResizeImage.configure({
    inline: false,
    allowBase64: true,
    // You might need to configure default width/height or other options here
    // based on the ResizeImage extension's documentation.
    // For now, let's keep it simple.
  }),
];
