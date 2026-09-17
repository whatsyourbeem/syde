"use client";

import { Editor, useEditorState } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  List,
  ListOrdered,
  Quote,
  Code,
  SquareCode,
  Minus,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Link2,
  ChevronDown,
  MoreHorizontal,
  CircleHelp,
} from "lucide-react";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
const MOD = isMac ? "⌘" : "Ctrl+";
const SHIFT = isMac ? "⇧" : "Shift+";

interface TiptapToolbarProps {
  editor: Editor;
  onImageUploadClick?: () => void;
  linkOpen: boolean;
  onLinkOpenChange: (open: boolean) => void;
}

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:"
      ? candidate
      : null;
  } catch {
    return null;
  }
}

function ToolbarButton({
  active = false,
  disabled = false,
  onClick,
  label,
  shortcut,
  className,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label: string;
  shortcut?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const title = shortcut ? `${label} (${shortcut})` : label;
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      variant={active ? "default" : "ghost"}
      size="sm"
      aria-label={label}
      aria-pressed={active}
      title={title}
      className={cn("shrink-0 h-10 min-w-10 px-2 md:h-8 md:min-w-8", className)}
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <div className="border-l h-6 mx-1 shrink-0" />;
}

function LinkButton({
  editor,
  active,
  open,
  onOpenChange,
}: {
  editor: Editor;
  active: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(editor.getAttributes("link").href ?? "");
    setError(false);
  }, [open, editor]);

  const apply = () => {
    const href = normalizeUrl(value);
    if (!href) {
      setError(true);
      return;
    }
    const { empty } = editor.state.selection;
    const chain = editor.chain().focus();
    if (empty && !editor.isActive("link")) {
      chain.insertContent({ type: "text", text: value.trim(), marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      chain.extendMarkRange("link").setLink({ href }).run();
    }
    onOpenChange(false);
  };

  const remove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={active ? "default" : "ghost"}
          size="sm"
          aria-label="링크"
          aria-pressed={active}
          title={`링크 (${MOD}K)`}
          className="shrink-0 h-10 min-w-10 px-2 md:h-8 md:min-w-8"
        >
          <Link2 size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <Input
            type="text"
            inputMode="url"
            placeholder="링크 주소 (https://...)"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                apply();
              }
            }}
            aria-invalid={error}
            className={cn(error && "border-red-500 focus-visible:ring-red-500")}
          />
          {error && <p className="text-xs text-red-500">올바른 링크 주소를 입력해주세요.</p>}
          <div className="flex justify-end gap-2">
            {active && (
              <Button type="button" variant="ghost" size="sm" onClick={remove} className="text-red-500">
                링크 제거
              </Button>
            )}
            <Button type="submit" size="sm">
              적용
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

const BLOCK_TYPES = [
  { key: "paragraph", label: "본문", previewClass: "text-sm" },
  { key: "h1", label: "제목 1", previewClass: "text-xl font-extrabold" },
  { key: "h2", label: "제목 2", previewClass: "text-lg font-bold" },
  { key: "h3", label: "제목 3", previewClass: "text-base font-bold" },
] as const;

const HEADING_LEVEL = { h1: 1, h2: 2, h3: 3 } as const;

function BlockTypeMenu({ editor, current }: { editor: Editor; current: string }) {
  const label = BLOCK_TYPES.find((t) => t.key === current)?.label ?? "본문";
  const apply = (key: (typeof BLOCK_TYPES)[number]["key"]) => {
    const chain = editor.chain().focus();
    if (key === "paragraph") chain.setParagraph().run();
    else chain.setHeading({ level: HEADING_LEVEL[key] }).run();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`문단 형식: ${label}`}
          title={`문단 형식 (${MOD}${isMac ? "⌥" : "Alt+"}1 · 2 · 3)`}
          className="shrink-0 h-10 px-2 md:h-8 gap-1 min-w-[72px] justify-between font-medium"
        >
          {label}
          <ChevronDown size={14} className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {BLOCK_TYPES.map((type) => (
          <DropdownMenuItem
            key={type.key}
            onSelect={() => apply(type.key)}
            className={cn(type.previewClass, current === type.key && "bg-accent")}
          >
            {type.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ShortcutHelp() {
  const markdown: [string, string][] = [
    ["# ", "제목 1"],
    ["## ", "제목 2"],
    ["### ", "제목 3"],
    ["- ", "글머리 기호 목록"],
    ["1. ", "번호 목록"],
    ["> ", "인용구"],
    ["```", "코드 블록"],
    ["---", "구분선"],
    ["`코드`", "인라인 코드"],
  ];
  const keys: [string, string][] = [
    [`${MOD}B`, "굵게"],
    [`${MOD}I`, "기울임"],
    [`${MOD}U`, "밑줄"],
    [`${MOD}K`, "링크"],
    [`${MOD}E`, "인라인 코드"],
    [`${MOD}Z`, "실행 취소"],
    [`${MOD}${SHIFT}Z`, "다시 실행"],
    ["Enter 두 번", "목록·인용·코드 블록 빠져나오기"],
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="작성 도움말"
          title="작성 도움말"
          className="shrink-0 h-10 min-w-10 px-2 md:h-8 md:min-w-8 text-muted-foreground"
        >
          <CircleHelp size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4 text-sm">
        <p className="font-semibold mb-2">빠르게 입력하기</p>
        <p className="text-xs text-muted-foreground mb-2">줄 맨 앞에 입력하면 자동으로 바뀌어요.</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mb-4">
          {markdown.map(([input, result]) => (
            <div key={input} className="contents">
              <dt><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{input}</code></dt>
              <dd className="text-muted-foreground">{result}</dd>
            </div>
          ))}
        </dl>
        <p className="font-semibold mb-2">단축키</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mb-4">
          {keys.map(([key, action]) => (
            <div key={key} className="contents">
              <dt><kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-sans">{key}</kbd></dt>
              <dd className="text-muted-foreground">{action}</dd>
            </div>
          ))}
        </dl>
        <p className="font-semibold mb-1">붙여넣기</p>
        <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
          <li>글자를 선택하고 주소를 붙여넣으면 링크가 걸려요.</li>
          <li>빈 줄에 주소를 붙여넣으면 미리보기 카드가 돼요.</li>
          <li>마크다운 글은 서식이 적용돼서 들어가요.</li>
          <li>이미지는 여러 장을 한 번에 붙여넣거나 끌어올 수 있어요.</li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export default function TiptapToolbar({ editor, onImageUploadClick, linkOpen, onLinkOpenChange }: TiptapToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      link: editor.isActive("link"),
      codeBlock: editor.isActive("codeBlock"),
      blockquote: editor.isActive("blockquote"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockType: editor.isActive("heading", { level: 1 })
        ? "h1"
        : editor.isActive("heading", { level: 2 })
          ? "h2"
          : editor.isActive("heading", { level: 3 })
            ? "h3"
            : "paragraph",
      align: editor.isActive({ textAlign: "center" }) ? "center" : editor.isActive({ textAlign: "right" }) ? "right" : "left",
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const AlignIcon = state.align === "center" ? AlignCenter : state.align === "right" ? AlignRight : AlignLeft;

  return (
    <div className="sticky top-[calc(var(--sticky-nav-height,0px)+var(--editor-bar-height,0px))] z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 mb-2">
      <div className="relative">
        <div ref={scrollRef} className="flex gap-0.5 items-center overflow-x-auto no-scrollbar px-1 py-1">
          <BlockTypeMenu editor={editor} current={state.blockType} />
          <Divider />
          <ToolbarButton label="굵게" shortcut={`${MOD}B`} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} className="font-bold text-base">
            B
          </ToolbarButton>
          <ToolbarButton label="기울임" shortcut={`${MOD}I`} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} className="italic text-base font-serif">
            I
          </ToolbarButton>
          <LinkButton editor={editor} active={state.link} open={linkOpen} onOpenChange={onLinkOpenChange} />
          {onImageUploadClick && (
            <ToolbarButton label="이미지" onClick={onImageUploadClick}>
              <ImageIcon size={16} />
            </ToolbarButton>
          )}
          <Divider />

          {/* On mobile undo/redo come right after the essentials still inside the first screen (no shortcuts there);
              on desktop order-last pushes them to the far right. */}
          <div className="flex items-center shrink-0 md:order-last md:ml-auto">
            <ToolbarButton label="실행 취소" shortcut={`${MOD}Z`} disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
              <Undo2 size={16} />
            </ToolbarButton>
            <ToolbarButton label="다시 실행" shortcut={`${MOD}${SHIFT}Z`} disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
              <Redo2 size={16} />
            </ToolbarButton>
            <div className="md:hidden"><Divider /></div>
            <div className="hidden md:block"><ShortcutHelp /></div>
          </div>

          <ToolbarButton label="글머리 기호 목록" shortcut={`${MOD}${SHIFT}8`} active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton label="번호 목록" shortcut={`${MOD}${SHIFT}7`} active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton label="인용구" shortcut={`${MOD}${SHIFT}B`} active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={14} />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="밑줄" shortcut={`${MOD}U`} active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} className="underline text-base">
            U
          </ToolbarButton>
          <ToolbarButton label="취소선" shortcut={`${MOD}${SHIFT}S`} active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()} className="line-through text-base">
            S
          </ToolbarButton>
          <ToolbarButton label="인라인 코드" shortcut={`${MOD}E`} active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code size={16} />
          </ToolbarButton>
          <ToolbarButton label="코드 블록" active={state.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <SquareCode size={16} />
          </ToolbarButton>
          <Divider />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" aria-label="더보기" title="정렬 · 구분선" className="shrink-0 h-10 min-w-10 px-2 md:h-8 md:min-w-8">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onSelect={() => editor.chain().focus().setTextAlign("left").run()} className={cn(state.align === "left" && "bg-accent")}>
                <AlignLeft size={16} /> 왼쪽 정렬
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => editor.chain().focus().setTextAlign("center").run()} className={cn(state.align === "center" && "bg-accent")}>
                <AlignCenter size={16} /> 가운데 정렬
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => editor.chain().focus().setTextAlign("right").run()} className={cn(state.align === "right" && "bg-accent")}>
                <AlignRight size={16} /> 오른쪽 정렬
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus size={16} /> 구분선
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {state.align !== "left" && (
            <span className="shrink-0 text-muted-foreground" title="현재 정렬">
              <AlignIcon size={14} />
            </span>
          )}
          <div className="md:hidden"><ShortcutHelp /></div>
        </div>
        {canScrollRight && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent md:hidden"
          />
        )}
      </div>
    </div>
  );
}
