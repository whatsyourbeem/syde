import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, type EditorState, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

type PlaceholderMeta = { add: { id: string; pos: number; count: number } } | { remove: { id: string } };

export const uploadPlaceholderKey = new PluginKey<DecorationSet>("uploadPlaceholder");

function createPlaceholderDom(count: number): HTMLElement {
  const el = document.createElement("span");
  el.className = "upload-placeholder";
  el.setAttribute("contenteditable", "false");
  el.setAttribute("role", "status");
  el.textContent = count > 1 ? `이미지 ${count}장 업로드 중…` : "이미지 업로드 중…";
  return el;
}

/**
 * Marks where an upload started. Decorations are remapped on every edit, so the image
 * still lands where it was pasted even if the writer keeps typing while it uploads.
 */
export const UploadPlaceholder = Extension.create({
  name: "uploadPlaceholder",

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: uploadPlaceholderKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set) {
            let next = set.map(tr.mapping, tr.doc);
            const meta = tr.getMeta(uploadPlaceholderKey) as PlaceholderMeta | undefined;
            if (meta && "add" in meta) {
              const { id, pos, count } = meta.add;
              next = next.add(tr.doc, [Decoration.widget(pos, () => createPlaceholderDom(count), { id, side: -1 })]);
            } else if (meta && "remove" in meta) {
              next = next.remove(next.find(undefined, undefined, (spec) => spec.id === meta.remove.id));
            }
            return next;
          },
        },
        props: {
          decorations(state) {
            return uploadPlaceholderKey.getState(state);
          },
        },
      }),
    ];
  },
});

export function addUploadPlaceholder(tr: Transaction, id: string, pos: number, count: number): Transaction {
  return tr.setMeta(uploadPlaceholderKey, { add: { id, pos, count } } satisfies PlaceholderMeta);
}

export function removeUploadPlaceholder(tr: Transaction, id: string): Transaction {
  return tr.setMeta(uploadPlaceholderKey, { remove: { id } } satisfies PlaceholderMeta);
}

/** Current position of a placeholder, or null if the text around it was deleted. */
export function findUploadPlaceholder(state: EditorState, id: string): number | null {
  const found = uploadPlaceholderKey.getState(state)?.find(undefined, undefined, (spec) => spec.id === id);
  return found?.length ? found[0].from : null;
}
