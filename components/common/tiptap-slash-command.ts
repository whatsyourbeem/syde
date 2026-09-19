import { Extension, type Editor, type Range } from "@tiptap/core";
import { Suggestion, type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { shift } from "@floating-ui/dom";
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
  Youtube,
  PanelTop,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { SlashCommandMenu, type SlashCommandMenuHandle } from "./slash-command-menu";
import { CALLOUT_META } from "./tiptap-callout";
import type { CalloutVariant } from "./tiptap-callout-shared";

export type SlashCommandGroup = "기본" | "목록" | "미디어" | "강조";

/** Blocks that are inserted from a URL the writer types into a prompt. */
export type EmbedKind = "youtube" | "bookmark";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: LucideIcon;
  group: SlashCommandGroup;
  keywords: string[];
  run: (editor: Editor, range: Range) => void;
}

export interface SlashCommandOptions {
  /** Opens the same file picker the toolbar's image button uses; the "이미지" entry is hidden without it. */
  onImageUploadClick?: () => void;
  /** Opens the same popover the toolbar's link button uses; the "링크" entry is hidden without it. */
  onLinkClick?: () => void;
  /** Opens the URL prompt for a YouTube video or link card; those entries are hidden without it. */
  onEmbedClick?: (kind: EmbedKind) => void;
}

const CALLOUT_DESCRIPTIONS: Record<CalloutVariant, string> = {
  info: "참고할 내용을 파란 박스로 감쌉니다",
  tip: "도움이 되는 팁을 초록 박스로 감쌉니다",
  warning: "주의할 점을 노란 박스로 감쌉니다",
};

function calloutItem(variant: CalloutVariant): SlashCommandItem {
  return {
    title: `콜아웃 · ${CALLOUT_META[variant].label}`,
    description: CALLOUT_DESCRIPTIONS[variant],
    icon: CALLOUT_META[variant].icon,
    group: "강조",
    keywords: ["callout", "콜아웃", "박스", "강조", variant, CALLOUT_META[variant].label],
    run: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "callout", attrs: { variant }, content: [{ type: "paragraph" }] })
        .run(),
  };
}

function buildItems(options: SlashCommandOptions): SlashCommandItem[] {
  const { onImageUploadClick, onLinkClick, onEmbedClick } = options;
  // Declared in menu order: the popup draws a group heading wherever the group changes.
  const items: (SlashCommandItem | false | undefined)[] = [
    {
      title: "본문",
      description: "일반 텍스트로 씁니다",
      icon: Pilcrow,
      group: "기본",
      keywords: ["paragraph", "text", "본문", "텍스트"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      title: "제목 1",
      description: "큰 섹션 제목",
      icon: Heading1,
      group: "기본",
      keywords: ["h1", "heading1", "제목1", "큰제목"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
    },
    {
      title: "제목 2",
      description: "중간 섹션 제목",
      icon: Heading2,
      group: "기본",
      keywords: ["h2", "heading2", "제목2"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
    },
    {
      title: "제목 3",
      description: "작은 섹션 제목",
      icon: Heading3,
      group: "기본",
      keywords: ["h3", "heading3", "제목3"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
    },
    {
      title: "글머리 기호 목록",
      description: "순서 없는 목록을 만듭니다",
      icon: List,
      group: "목록",
      keywords: ["bullet", "list", "ul", "목록", "불릿"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: "번호 목록",
      description: "번호가 매겨진 목록을 만듭니다",
      icon: ListOrdered,
      group: "목록",
      keywords: ["ordered", "number", "ol", "번호", "숫자"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: "체크리스트",
      description: "할 일 목록을 만듭니다",
      icon: ListChecks,
      group: "목록",
      keywords: ["task", "todo", "checklist", "체크리스트", "할일", "체크박스"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    onImageUploadClick && {
      title: "이미지",
      description: "파일을 선택해 이미지를 삽입합니다",
      icon: ImageIcon,
      group: "미디어",
      keywords: ["image", "img", "picture", "이미지", "사진", "그림"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).run();
        onImageUploadClick();
      },
    },
    onEmbedClick && {
      title: "유튜브",
      description: "영상 주소를 넣어 영상을 삽입합니다",
      icon: Youtube,
      group: "미디어",
      keywords: ["youtube", "video", "유튜브", "영상", "동영상", "쇼츠", "shorts"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).run();
        onEmbedClick("youtube");
      },
    },
    onEmbedClick && {
      title: "링크 카드",
      description: "주소를 넣어 미리보기 카드를 만듭니다",
      icon: PanelTop,
      group: "미디어",
      keywords: ["bookmark", "embed", "card", "링크카드", "북마크", "카드", "미리보기"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).run();
        onEmbedClick("bookmark");
      },
    },
    onLinkClick && {
      title: "링크",
      description: "주소를 입력해 링크를 겁니다",
      icon: Link2,
      group: "미디어",
      keywords: ["link", "url", "링크", "주소"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).run();
        onLinkClick();
      },
    },
    {
      title: "인용구",
      description: "인용문을 강조합니다",
      icon: Quote,
      group: "강조",
      keywords: ["quote", "blockquote", "인용"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    calloutItem("info"),
    calloutItem("tip"),
    calloutItem("warning"),
    {
      title: "코드 블록",
      description: "구문 강조가 되는 코드를 씁니다",
      icon: SquareCode,
      group: "강조",
      keywords: ["code", "codeblock", "코드"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: "표",
      description: "3×3 표를 삽입합니다",
      icon: Table2,
      group: "강조",
      keywords: ["table", "표", "테이블"],
      run: (editor, range) =>
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: "구분선",
      description: "가로 구분선을 삽입합니다",
      icon: Minus,
      group: "강조",
      keywords: ["divider", "hr", "구분선", "수평선"],
      run: (editor, range) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
  ];
  return items.filter((item): item is SlashCommandItem => !!item);
}

function filterItems(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (item) => item.title.toLowerCase().includes(q) || item.keywords.some((keyword) => keyword.includes(q)),
  );
}

function suggestionRender(): NonNullable<SuggestionOptions<SlashCommandItem, SlashCommandItem>["render"]> {
  return () => {
    let component: ReactRenderer<SlashCommandMenuHandle, { items: SlashCommandItem[]; command: (item: SlashCommandItem) => void }> | undefined;
    let unmount: (() => void) | undefined;

    const close = () => {
      unmount?.();
      component?.destroy();
      unmount = undefined;
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
        const popup = document.createElement("div");
        popup.className = "z-50";
        // Fixed from the start so the popup never sits in the page flow (at the bottom of <body>) before
        // mount() positions it; mount() overwrites top/left with the real coordinates.
        Object.assign(popup.style, { position: "fixed", top: "0px", left: "0px" });
        popup.appendChild(component.element);
        // Suggestion keeps the popup anchored to the "/" across scroll, resize and layout shifts,
        // and closes it on a click outside both the popup and the editor.
        unmount = props.mount(popup);
      },
      onUpdate: (props) => {
        component?.updateProps({ items: props.items, command: (item: SlashCommandItem) => props.command(item) });
      },
      // Escape is left to Suggestion (return false): it exits and remembers the dismissal, so the menu
      // stays closed while the writer keeps typing. Handling it here would only hide the popup while
      // the suggestion stayed active, and the next Enter would run a command no one can see.
      onKeyDown: (props) => (props.event.key === "Escape" ? false : (component?.ref?.onKeyDown(props.event) ?? false)),
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
      onEmbedClick: undefined,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      Suggestion<SlashCommandItem, SlashCommandItem>({
        editor: this.editor,
        char: "/",
        startOfLine: true,
        placement: "bottom-start",
        offset: { mainAxis: 6 },
        // Fixed so the menu isn't clipped by scrolling containers; shift keeps it on screen near the right edge.
        floatingUi: { strategy: "fixed", middleware: [shift({ padding: 8 })] },
        allow: ({ editor }) => !editor.isActive("codeBlock"),
        items: ({ query }) => filterItems(buildItems(options), query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: suggestionRender(),
      }),
    ];
  },
});
