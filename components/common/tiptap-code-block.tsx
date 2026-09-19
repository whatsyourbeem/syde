"use client";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { lowlight, CODE_LANGUAGES } from "./tiptap-lowlight";

function CodeBlockView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const language = (node.attrs.language as string | null) ?? "";

  return (
    <NodeViewWrapper as="pre" className={editor.isEditable ? "relative !pt-10" : undefined}>
      {editor.isEditable && (
        <select
          contentEditable={false}
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value || null })}
          aria-label="코드 언어"
          className="absolute right-2 top-2 rounded border border-white/15 bg-white/10 px-1.5 py-0.5 font-sans text-[11px] text-gray-200 outline-none hover:bg-white/20 [&>option]:text-black"
        >
          <option value="">자동 감지</option>
          {/* Aliases such as "ts" from pasted markdown highlight correctly but aren't in the canonical list. */}
          {language && !CODE_LANGUAGES.some(({ value }) => value === language) && (
            <option value={language}>{language}</option>
          )}
          {CODE_LANGUAGES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      )}
      <NodeViewContent<"code"> as="code" className={language ? `language-${language}` : undefined} />
    </NodeViewWrapper>
  );
}

export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },

  addKeyboardShortcuts() {
    const parent = this.parent?.() ?? {};
    return {
      ...parent,
      // Lists and quotes exit on a second Enter; match that instead of the default triple Enter.
      Enter: (props) => {
        const { state } = props.editor;
        const { $from, empty } = state.selection;
        const atEnd = $from.parentOffset === $from.parent.content.size;
        if (empty && $from.parent.type === this.type && atEnd && $from.parent.textContent.endsWith("\n")) {
          return props.editor
            .chain()
            .command(({ tr }) => {
              tr.delete($from.pos - 1, $from.pos);
              return true;
            })
            .exitCode()
            .run();
        }
        return parent.Enter?.(props) ?? false;
      },
    };
  },
}).configure({ lowlight, defaultLanguage: null, enableTabIndentation: true });
