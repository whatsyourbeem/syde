import { Extension, type Editor, type Range } from "@tiptap/core";
import { Suggestion, type SuggestionOptions } from "@tiptap/suggestion";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import {
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  SquareCode,
  Minus,
  Table2,
  ImageIcon,
  Link2,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";
import { SlashCommandMenu, type SlashCommandMenuHandle } from "./slash-command-menu";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  run: (editor: Editor, range: Range) => void;
}

export interface SlashCommandOptions {
  /** Opens the same file picker the toolbar's image button uses; the "이미지" entry is hidden without it. */
  onImageUploadClick?: () => void;
  /** Opens the same popover the toolbar's link button uses; the "링크" entry is hidden without it. */
  onLinkClick?: () => void;
}

function buildItems(options: SlashCommandOptions): SlashCommandItem[] {
  const items: SlashCommandItem[] = [
    {
      title: "본문",
      description: "일반 텍스트로 씁니다",
      icon: Pilcrow,
      keywords: ["paragraph", "text", "본문", "텍스트"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      title: "제목 1",
      description: "큰 섹션 제목",
      icon: Heading1,
      keywords: ["h1", "heading1", "제목1", "큰제목"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
    },
    {
      title: "제목 2",
      description: "중간 섹션 제목",
      icon: Heading2,
      keywords: ["h2", "heading2", "제목2"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
    },
    {
      title: "제목 3",
      description: "작은 섹션 제목",
      icon: Heading3,
      keywords: ["h3", "heading3", "제목3"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
    },
    {
      title: "글머리 기호 목록",
      description: "순서 없는 목록을 만듭니다",
      icon: List,
      keywords: ["bullet", "list", "ul", "목록", "불릿"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: "번호 목록",
      description: "번호가 매겨진 목록을 만듭니다",
      icon: ListOrdered,
      keywords: ["ordered", "number", "ol", "번호", "숫자"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: "체크리스트",
      description: "할 일 목록을 만듭니다",
      icon: ListChecks,
      keywords: ["task", "todo", "checklist", "체크리스트", "할일", "체크박스"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
      title: "인용구",
      description: "인용문을 강조합니다",
      icon: Quote,
      keywords: ["quote", "blockquote", "인용"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: "코드 블록",
      description: "구문 강조가 되는 코드를 씁니다",
      icon: SquareCode,
      keywords: ["code", "codeblock", "코드"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: "표",
      description: "3×3 표를 삽입합니다",
      icon: Table2,
      keywords: ["table", "표", "테이블"],
      run: (editor, range) =>
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: "구분선",
      description: "가로 구분선을 삽입합니다",
      icon: Minus,
      keywords: ["divider", "hr", "구분선", "수평선"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: "콜아웃",
      description: "강조하고 싶은 내용을 박스로 감쌉니다",
      icon: MessageSquareText,
      keywords: ["callout", "콜아웃", "박스", "강조"],
      run: (editor, range) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({ type: "callout", attrs: { variant: "info" }, content: [{ type: "paragraph" }] })
          .run(),
    },
  ];

  if (options.onImageUploadClick) {
    const onImageUploadClick = options.onImageUploadClick;
    items.push({
      title: "이미지",
      description: "파일을 선택해 이미지를 삽입합니다",
      icon: ImageIcon,
      keywords: ["image", "img", "이미지", "사진"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).run();
        onImageUploadClick();
      },
    });
  }

  if (options.onLinkClick) {
    const onLinkClick = options.onLinkClick;
    items.push({
      title: "링크",
      description: "주소를 입력해 링크를 겁니다",
      icon: Link2,
      keywords: ["link", "url", "링크", "주소"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).run();
        onLinkClick();
      },
    });
  }

  return items;
}

function filterItems(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (item) => item.title.toLowerCase().includes(q) || item.keywords.some((keyword) => keyword.includes(q)),
  );
}

const MENU_WIDTH = 256; // matches SlashCommandMenu's w-64
const MENU_MAX_HEIGHT = 320; // matches SlashCommandMenu's max-h-80

function positionMenu(el: HTMLElement, rect: DOMRect) {
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpward = spaceBelow < MENU_MAX_HEIGHT && rect.top > spaceBelow;
  el.style.top = openUpward ? `${Math.max(8, rect.top - MENU_MAX_HEIGHT - 6)}px` : `${rect.bottom + 6}px`;
  el.style.left = `${Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8)}px`;
}

/**
 * Position of the "/" the writer dismissed with Escape, mapped through later edits and cleared once
 * that "/" is deleted. Suggestion has no memory of a dismissal and re-opens on the very next
 * transaction (e.g. the Enter that follows Escape); like Notion, a dismissed "/" stays plain text
 * until a new "/" is typed.
 */
const dismissedSlashKey = new PluginKey<number | null>("slashCommandDismissed");

const dismissedSlashPlugin = new Plugin<number | null>({
  key: dismissedSlashKey,
  state: {
    init: () => null,
    apply(tr, value) {
      const meta = tr.getMeta(dismissedSlashKey) as number | undefined;
      if (meta !== undefined) return meta;
      if (value === null) return null;
      const mapped = tr.mapping.mapResult(value);
      return mapped.deleted ? null : mapped.pos;
    },
  },
});

function suggestionRender(): NonNullable<SuggestionOptions<SlashCommandItem, SlashCommandItem>["render"]> {
  return () => {
    let component: ReactRenderer<SlashCommandMenuHandle, { items: SlashCommandItem[]; command: (item: SlashCommandItem) => void }> | undefined;
    let popup: HTMLDivElement | undefined;

    const close = () => {
      popup?.remove();
      component?.destroy();
      popup = undefined;
      component = undefined;
    };

    return {
      onStart: (props) => {
        // Suggestion resolves items asynchronously, so a start can land after a later exit; never leave an orphan popup.
        close();
        component = new ReactRenderer(SlashCommandMenu, {
          props: { items: props.items, command: (item: SlashCommandItem) => props.command(item) },
          editor: props.editor,
        });
        popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.zIndex = "50";
        popup.appendChild(component.element);
        document.body.appendChild(popup);
        const rect = props.clientRect?.();
        if (rect) positionMenu(popup, rect);
      },
      onUpdate: (props) => {
        if (!component || !popup) return;
        component.updateProps({ items: props.items, command: (item: SlashCommandItem) => props.command(item) });
        const rect = props.clientRect?.();
        if (rect) positionMenu(popup, rect);
      },
      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          // Remember the dismissed "/", then let Suggestion itself exit (returning false) so its state is
          // cleared too; hiding only the popup would leave the next Enter running a command no one can see.
          props.view.dispatch(props.view.state.tr.setMeta(dismissedSlashKey, props.range.from));
          return false;
        }
        return component?.ref?.onKeyDown(props.event) ?? false;
      },
      onExit: close,
    };
  };
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      onImageUploadClick: undefined,
      onLinkClick: undefined,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      // Must come before Suggestion: its allow() reads this plugin's state on the state being built.
      dismissedSlashPlugin,
      Suggestion<SlashCommandItem, SlashCommandItem>({
        editor: this.editor,
        char: "/",
        startOfLine: true,
        allow: ({ editor, state, range }) =>
          !editor.isActive("codeBlock") && dismissedSlashKey.getState(state) !== range.from,
        items: ({ query }) => filterItems(buildItems(options), query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: suggestionRender(),
      }),
    ];
  },
});
