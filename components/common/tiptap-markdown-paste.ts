import { marked } from "marked";
import { DOMParser as PMDOMParser, Fragment, Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

const STRONG_SIGNALS = [
  /^#{1,6}\s+\S/m,
  /^```/m,
  /\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)/,
  /^>\s?\S/m,
  /(^\s*[-*+]\s+\S.*\n){1,}^\s*[-*+]\s+\S/m,
  /(^\s*\d+\.\s+\S.*\n){1,}^\s*\d+\.\s+\S/m,
  // GFM table header-separator row, e.g. "|---|---|" or "| :-- | --: |" — appears in nothing but a table.
  /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/m,
];

const WEAK_SIGNALS = [
  /\*\*[^*\n]+\*\*/,
  /`[^`\n]+`/,
  /^(-{3,}|\*{3,})\s*$/m,
  /^\s*[-*+]\s+\S/m,
  /^\s*\d+\.\s+\S/m,
];

const BLOCK_CONTAINERS = new Set(["UL", "OL", "LI", "BLOCKQUOTE", "TABLE", "THEAD", "TBODY", "TR"]);

// Rich sources (Notion, Google Docs, web pages) already ship structured HTML that the default paste handles well.
const SEMANTIC_HTML = /<(h[1-6]|ul|ol|li|strong|b|em|i|blockquote|pre|code|table|a)[\s>]/i;

export function looksLikeMarkdown(text: string, html: string | undefined): boolean {
  if (html && SEMANTIC_HTML.test(html)) return false;
  if (STRONG_SIGNALS.some((re) => re.test(text))) return true;
  return WEAK_SIGNALS.filter((re) => re.test(text)).length >= 2;
}

export function pasteMarkdown(view: EditorView, markdown: string): void {
  const html = (marked.parse(markdown, { async: false, gfm: true }) as string).replace(/\n<\/code><\/pre>/g, "</code></pre>");
  // DOMParser yields an inert document: raw HTML inside the markdown can't run scripts or load resources.
  const body = new window.DOMParser().parseFromString(html, "text/html").body;
  // marked separates blocks with "\n"; at block level those become stray empty paragraphs.
  [body, ...Array.from(body.querySelectorAll("*"))]
    .filter((el) => el === body || BLOCK_CONTAINERS.has(el.tagName))
    .forEach((el) => {
      Array.from(el.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) child.remove();
      });
    });
  body.querySelectorAll("img").forEach((img) => {
    if (!/^https?:\/\//i.test(img.getAttribute("src") ?? "")) img.remove();
  });
  // Images are block nodes in this schema; a <p> wrapping only images would leave an empty paragraph behind.
  body.querySelectorAll("p").forEach((p) => {
    const onlyImages = Array.from(p.childNodes).every(
      (child) => (child as Element).tagName === "IMG" || (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()),
    );
    if (onlyImages && p.querySelector("img")) p.replaceWith(...Array.from(p.querySelectorAll("img")));
  });
  const slice = PMDOMParser.fromSchema(view.state.schema).parseSlice(body);
  view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView().setMeta("paste", true).setMeta("uiEvent", "paste"));
}

export function pastePlainText(view: EditorView, text: string): void {
  const { schema } = view.state;
  const paragraphs = text
    .split(/\r?\n/)
    .map((line) => schema.nodes.paragraph.create(null, line ? schema.text(line) : null));
  view.dispatch(view.state.tr.replaceSelection(new Slice(Fragment.from(paragraphs), 1, 1)).scrollIntoView());
}
