import type { JSONContent } from "@tiptap/react";

/**
 * Flattens a Tiptap document (or its JSON string) into plain text, one space between blocks,
 * for summaries, meta descriptions and list excerpts. Unparseable strings are treated as plain text.
 */
export function extractPlainText(
  content: JSONContent | string | null | undefined,
  maxLength?: number,
): string {
  if (!content) return "";

  let doc: JSONContent | string = content;
  if (typeof content === "string") {
    try {
      doc = JSON.parse(content);
    } catch {
      doc = content;
    }
  }

  const collect = (node: JSONContent | string | null): string => {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (node.type === "text") return node.text ?? "";
    if (node.type === "hardBreak") return " ";
    const children = node.content ?? [];
    // Inline runs (differently marked text inside one paragraph) must stay glued together; only blocks get a space.
    const isTextblock = children.some((child) => child.type === "text" || child.type === "hardBreak");
    return children.map(collect).filter(Boolean).join(isTextblock ? "" : " ");
  };

  const text = collect(doc).replace(/\s+/g, " ").trim();
  if (maxLength === undefined || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
