import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ResizeImage from "tiptap-extension-resize-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Paragraph } from "@tiptap/extension-paragraph";
import { TableKit } from "@tiptap/extension-table";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import Youtube from "@tiptap/extension-youtube";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import type { DOMOutputSpec } from "@tiptap/pm/model";
import type { Element as HastElement, Root as HastRoot, RootContent as HastContent } from "hast";
import { generateHTML, generateJSON } from "@tiptap/html";
import { lowlight } from "./tiptap-lowlight";
import { ImageCaption } from "./tiptap-image-caption";
import { shouldAutoLink } from "./tiptap-link-autolink";
import { isCalloutVariant, type CalloutVariant } from "./tiptap-callout-shared";

function isHttpUrl(value: unknown): value is string {
    return typeof value === "string" && /^https?:\/\//i.test(value);
}

// Rendered as a plain anchor; RichContent upgrades it to an OG preview card on the client.
const ServerLinkPreview = Node.create({
    name: 'linkPreview',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: (element) => element.getAttribute('data-src') ?? element.getAttribute('href'),
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: '[data-type="link-preview"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        if (!isHttpUrl(HTMLAttributes.src)) return ['p', {}]
        return ['a', { href: HTMLAttributes.src, 'data-type': 'link-preview', target: '_blank', rel: 'noopener noreferrer nofollow' }, HTMLAttributes.src]
    },
});

const SAFE_IMAGE_STYLE = /^(width|height|margin)\s*:\s*((\d+(\.\d+)?(px|%))|auto|0)(\s+((\d+(\.\d+)?(px|%))|auto|0)){0,3}$/i;

// The resize node view applies `containerStyle` (width / alignment margin) at runtime; bake the safe parts into a real style.
const ServerImage = ResizeImage.extend({
    renderHTML({ node }) {
        const { src, alt, title, containerStyle } = node.attrs as Record<string, string | null>;
        if (!src || !/^(https?:\/\/|data:image\/)/i.test(src)) return ['p', {}];
        const declarations = (containerStyle ?? "")
            .split(";")
            .map((part) => part.trim())
            .filter((part) => SAFE_IMAGE_STYLE.test(part));
        // The stored margin ("0px auto") is for horizontal alignment; restore prose's vertical rhythm after it,
        // otherwise images touch the text around them and captions overlap.
        const style = ["display: block", "max-width: 100%", "height: auto", ...declarations, "margin-top: 2em", "margin-bottom: 2em"].join("; ");
        // Lazy: storage egress is billed per byte served, and most readers never scroll to every image in a post.
        const attrs: Record<string, string> = { src, style, loading: "lazy", decoding: "async" };
        if (alt) attrs.alt = alt;
        if (title) attrs.title = title;
        return ['img', attrs];
    },
});

function hastToSpec(node: HastContent): DOMOutputSpec | string {
    if (node.type === "text") return node.value;
    if (node.type === "element") {
        const element = node as HastElement;
        const className = element.properties?.className;
        const attrs = Array.isArray(className) ? { class: className.join(" ") } : {};
        return [element.tagName, attrs, ...element.children.map(hastToSpec)] as DOMOutputSpec;
    }
    return "";
}

// Client-side highlighting is a ProseMirror decoration and never reaches generated HTML, so bake the spans in here.
const ServerCodeBlock = CodeBlockLowlight.extend({
    renderHTML({ node }) {
        const language = node.attrs.language as string | null;
        const code = node.textContent;
        let tree: HastRoot;
        try {
            tree = language && lowlight.registered(language)
                ? lowlight.highlight(language, code)
                : lowlight.highlightAuto(code);
        } catch {
            return ["pre", ["code", language ? { class: `language-${language}` } : {}, code]];
        }
        return [
            "pre",
            ["code", { class: `hljs${language ? ` language-${language}` : ""}` }, ...tree.children.map(hastToSpec)],
        ] as DOMOutputSpec;
    },
}).configure({ lowlight, defaultLanguage: null, enableTabIndentation: true });

// A blank line (Enter twice) has no content, so its margins collapse against its neighbors and the
// blank line vanishes from the published post. The editor avoids this for free via ProseMirror's
// caret-placement `<br>`; give the reader the same `<br>` explicitly.
const ServerParagraph = Paragraph.extend({
    renderHTML({ HTMLAttributes, node }) {
        return ["p", HTMLAttributes, node.content.size === 0 ? ["br"] : 0] as DOMOutputSpec;
    },
});

// The editor's node view lets a reader-side checkbox click silently toggle state that goes nowhere;
// disable it so a published checklist reads as the static record it is.
const ServerTaskItem = TaskItem.extend({
    renderHTML({ node, HTMLAttributes }) {
        return [
            "li",
            mergeAttributes(HTMLAttributes, { "data-type": "taskItem", "data-checked": node.attrs.checked }),
            ["label", ["input", { type: "checkbox", checked: node.attrs.checked ? "checked" : null, disabled: "disabled" }], ["span"]],
            ["div", 0],
        ] as DOMOutputSpec;
    },
});

// Mirrors Callout (tiptap-callout.tsx) minus the client-only variant-switcher node view.
const ServerCallout = Node.create({
    name: "callout",
    group: "block",
    content: "block+",

    addAttributes() {
        return {
            variant: {
                default: "info",
                parseHTML: (element) => {
                    const value = element.getAttribute("data-variant");
                    return isCalloutVariant(value) ? value : "info";
                },
                renderHTML: (attributes) => ({ "data-variant": attributes.variant }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="callout"]' }];
    },

    renderHTML({ HTMLAttributes, node }) {
        const variant: CalloutVariant = isCalloutVariant(node.attrs.variant) ? node.attrs.variant : "info";
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "callout", class: `callout callout-${variant}` }),
            0,
        ] as DOMOutputSpec;
    },
});

// Lets headings carry an `id` so posts can be linked and outlined by section. Stored documents have none;
// getRenderedArticle injects them right before rendering.
const HeadingId = Extension.create({
    name: "headingId",
    addGlobalAttributes() {
        return [
            {
                types: ["heading"],
                attributes: {
                    id: {
                        default: null,
                        parseHTML: (element: HTMLElement) => element.getAttribute("id"),
                        renderHTML: (attributes: Record<string, unknown>) => (attributes.id ? { id: attributes.id } : {}),
                    },
                },
            },
        ];
    },
});

export const serverTiptapExtensions = [
    StarterKit.configure({
        codeBlock: false,
        paragraph: false,
        link: {
            openOnClick: true,
            autolink: true,
            shouldAutoLink,
        },
    }),
    ServerParagraph,
    ServerCodeBlock,
    ServerLinkPreview,
    TextAlign.configure({
        types: ["heading", "paragraph"],
    }),
    ServerImage.configure({
        inline: false,
        allowBase64: true,
    }),
    ImageCaption,
    // The editor gets its scroll wrapper for free from the resizable table's node view; static HTML needs it explicitly.
    TableKit.configure({ table: { renderWrapper: true } }),
    TaskList,
    ServerTaskItem,
    Youtube.configure({ width: 640, height: 360 }),
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    ServerCallout,
    HeadingId,
];

type TiptapDoc = Parameters<typeof generateHTML>[0];

// Stored content is Tiptap JSON (object or string); anything else is legacy text/HTML parsed through the schema.
function toTiptapDoc(content: unknown): TiptapDoc | null {
    if (!content) return null;
    let doc: unknown = content;
    if (typeof content === "string") {
        try {
            doc = JSON.parse(content);
        } catch {
            doc = null;
        }
        if (!doc || typeof doc !== "object") {
            doc = generateJSON(content, serverTiptapExtensions);
        }
    }
    return doc && typeof doc === "object" ? (doc as TiptapDoc) : null;
}

/**
 * Renders stored editor content to HTML that is safe to inject.
 * Legacy non-JSON strings (plain text or old HTML) are parsed through the schema first, which drops anything it doesn't model.
 */
export function getInitialHtmlFromTiptap(content: unknown): string {
    try {
        const doc = toTiptapDoc(content);
        return doc ? generateHTML(doc, serverTiptapExtensions) : "";
    } catch {
        return "";
    }
}

export interface TocItem {
    level: 1 | 2 | 3;
    text: string;
    id: string;
}

type DocNode = { type?: string; attrs?: Record<string, unknown>; content?: DocNode[]; text?: string };

function nodeText(node: DocNode): string {
    return node.text ?? (node.content ?? []).map(nodeText).join("");
}

// Keeps Hangul and alphanumerics, turns whitespace into "-" and drops everything else.
function slugifyHeading(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/\s+/g, "-");
}

/**
 * Like getInitialHtmlFromTiptap, but gives every heading a stable `id` and returns the outline.
 * Duplicate titles get "-2", "-3"…; the stored document is never modified.
 */
export function getRenderedArticle(content: unknown): { html: string; toc: TocItem[] } {
    try {
        const source = toTiptapDoc(content);
        if (!source) return { html: "", toc: [] };

        const doc = structuredClone(source) as DocNode;
        const toc: TocItem[] = [];
        const used = new Set<string>();

        const visit = (node: DocNode) => {
            if (node.type === "heading") {
                const level = Number(node.attrs?.level) || 1;
                const text = nodeText(node).trim();
                if (text) {
                    const base = slugifyHeading(text) || "section";
                    let id = base;
                    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
                    used.add(id);
                    node.attrs = { ...node.attrs, id };
                    // The editor only offers levels 1-3; deeper ones still get an id but stay out of the outline.
                    if (level <= 3) toc.push({ level: level as TocItem["level"], text, id });
                }
            }
            node.content?.forEach(visit);
        };
        visit(doc);

        return { html: generateHTML(doc as TiptapDoc, serverTiptapExtensions), toc };
    } catch {
        return { html: "", toc: [] };
    }
}
