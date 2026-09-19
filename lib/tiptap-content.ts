import { JSONContent } from "@tiptap/react";

// Nodes that count as real content even without any text in them.
const NON_TEXT_CONTENT_NODES = new Set(["imageResize", "linkPreview", "youtube", "horizontalRule"]);

/**
 * True when a Tiptap document (or legacy string content) has nothing a reader would see.
 * A doc with only empty paragraphs (e.g. typed then deleted) still counts as empty.
 */
export function isTiptapContentEmpty(content: JSONContent | string | null | undefined): boolean {
  if (!content) return true;
  if (typeof content === "string") return !content.trim();
  const hasContent = (node: JSONContent): boolean =>
    (node.type !== undefined && NON_TEXT_CONTENT_NODES.has(node.type)) ||
    !!node.text?.trim() ||
    (node.content ?? []).some(hasContent);
  return !hasContent(content);
}
