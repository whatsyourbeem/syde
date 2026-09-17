import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ResizeImage from "tiptap-extension-resize-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Node } from '@tiptap/core';
import type { DOMOutputSpec } from "@tiptap/pm/model";
import type { Element as HastElement, Root as HastRoot, RootContent as HastContent } from "hast";
import { generateHTML, generateJSON } from "@tiptap/html";
import { lowlight } from "./tiptap-lowlight";
import { ImageCaption } from "./tiptap-image-caption";

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
}).configure({ lowlight, defaultLanguage: null });

export const serverTiptapExtensions = [
    StarterKit.configure({
        codeBlock: false,
        link: {
            openOnClick: true,
            autolink: true,
        },
    }),
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
];

/**
 * Renders stored editor content to HTML that is safe to inject.
 * Legacy non-JSON strings (plain text or old HTML) are parsed through the schema first, which drops anything it doesn't model.
 */
export function getInitialHtmlFromTiptap(content: unknown): string {
    if (!content) return "";
    try {
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
        if (!doc || typeof doc !== "object") return "";
        return generateHTML(doc as Parameters<typeof generateHTML>[0], serverTiptapExtensions);
    } catch {
        return "";
    }
}
