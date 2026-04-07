import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ResizeImage from "tiptap-extension-resize-image";
import { mergeAttributes, Node } from '@tiptap/core';

// A stripped down LinkPreview that doesn't use ReactNodeViewRenderer for SSR
const ServerLinkPreview = Node.create({
    name: 'linkPreview',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="link-preview"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        // For SSR, we just render a simple anchor link so crawlers can at least see the URL.
        if (HTMLAttributes.src) {
            return ['a', { href: HTMLAttributes.src, 'data-type': 'link-preview' }, HTMLAttributes.src]
        }
        return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'link-preview' })]
    },
});

import { generateHTML } from "@tiptap/html";

export const serverTiptapExtensions = [
    StarterKit.configure({
        link: {
            openOnClick: true,
            autolink: true,
        },
    }),
    ServerLinkPreview,
    TextAlign.configure({
        types: ["heading", "paragraph"],
    }),
    ResizeImage.configure({
        inline: false,
        allowBase64: true,
    }),
];

export function getInitialHtmlFromTiptap(content: any): string {
    let initialHtml = "";
    if (!content) return initialHtml;
    try {
        let contentObj = content;
        if (typeof contentObj === "string") {
            try {
                contentObj = JSON.parse(contentObj);
            } catch (e) {
                // If it's just plain text/html string, use it directly.
            }
        }
        if (contentObj && typeof contentObj === "object") {
            initialHtml = generateHTML(contentObj, serverTiptapExtensions);
        } else if (typeof content === "string") {
            initialHtml = content;
        }
    } catch (e) {
        initialHtml = typeof content === "string" ? content : "";
    }
    return initialHtml;
}
