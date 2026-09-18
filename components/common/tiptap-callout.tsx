"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { CALLOUT_VARIANTS, isCalloutVariant, type CalloutVariant } from "./tiptap-callout-shared";

export { CALLOUT_VARIANTS };

export const CALLOUT_META = {
  info: { label: "정보", icon: Info },
  tip: { label: "팁", icon: Lightbulb },
  warning: { label: "주의", icon: TriangleAlert },
} as const;

// Only the variant switcher (editing-only chrome, positioned like the code block's language select)
// is a React affordance; the box itself is styled by the shared `.callout` CSS (globals.css) so the
// editor looks exactly like the published post.
function CalloutView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const variant: CalloutVariant = isCalloutVariant(node.attrs.variant) ? node.attrs.variant : "info";

  return (
    <NodeViewWrapper className={cn("callout", `callout-${variant}`, editor.isEditable && "relative")}>
      {editor.isEditable && (
        <div contentEditable={false} className="callout-switcher">
          {CALLOUT_VARIANTS.map((key) => {
            const ItemIcon = CALLOUT_META[key].icon;
            return (
              <button
                key={key}
                type="button"
                title={CALLOUT_META[key].label}
                onClick={() => updateAttributes({ variant: key })}
                className={cn("callout-switcher-btn", key === variant && "is-active")}
              >
                <ItemIcon size={14} />
              </button>
            );
          })}
        </div>
      )}
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

// A highlighted aside (info/tip/warning), similar to GitHub's markdown alerts. Content-model matches
// blockquote's ("block+") so Enter-to-exit at an empty line works the same way, with no custom keymap needed.
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

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
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});
