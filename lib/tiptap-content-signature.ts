import { JSONContent } from "@tiptap/react";

// The editor normalizes documents on load (adds null attrs, a trailing empty paragraph), so two
// logically-identical documents can otherwise serialize differently depending on where they came
// from (freshly loaded vs. round-tripped through the live editor). Strip that noise before comparing.
function normalizeNode(node: JSONContent): JSONContent {
  const attrs = node.attrs
    ? Object.fromEntries(Object.entries(node.attrs).filter(([, value]) => value !== null && value !== undefined))
    : undefined;
  return {
    ...node,
    attrs: attrs && Object.keys(attrs).length > 0 ? attrs : undefined,
    content: node.content?.map(normalizeNode),
  };
}

/**
 * Normalizes a Tiptap document (or legacy string content) for equality comparison — e.g. to detect
 * whether a saved draft actually differs from what's currently loaded. A trailing empty paragraph
 * (left behind by editing and deleting) doesn't count as content.
 */
export function normalizeTiptapContent(content: JSONContent | string): JSONContent[] | string {
  // An empty string and an empty doc must normalize to the same shape, or they'll never compare equal.
  if (typeof content === "string") return content.trim() || [];
  let body = normalizeNode(content).content ?? [];
  while (body.length > 0 && body[body.length - 1].type === "paragraph" && !body[body.length - 1].content?.length) {
    body = body.slice(0, -1);
  }
  return body;
}
