import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapImage from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";

// 1. Extend the Tiptap Image extension to add alignment
const CustomImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'left',
        renderHTML: attributes => ({
          'data-align': attributes.align,
        }),
      },
      style: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-align]',
        getAttrs: node => ({
          align: node.getAttribute('data-align'),
        }),
      },
    ];
  },
});

export const commonTiptapExtensions = [
  StarterKit,
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
  CustomImage.configure({
    inline: false,
    allowBase64: true,
  }),
];
