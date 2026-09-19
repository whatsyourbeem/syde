import { Node, mergeAttributes } from "@tiptap/core";

// A text block that sits under an image. Kept as its own node (not a styled paragraph)
// so captions render consistently and can be found/styled on the reader side.
export const ImageCaption = Node.create({
  name: "imageCaption",
  group: "block",
  content: "inline*",

  parseHTML() {
    return [{ tag: 'p[data-type="image-caption"]', priority: 60 }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes, { "data-type": "image-caption", class: "image-caption" }), 0];
  },
});
