"use client";

import { forwardRef, Fragment, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { SlashCommandItem } from "./tiptap-slash-command";

export interface SlashCommandMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

/**
 * Notion-style "/" block picker. Keyboard nav (arrows/enter) is driven from outside via the
 * imperative handle, since the keydown listener lives on the ProseMirror DOM, not this popup.
 */
export const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, SlashCommandMenuProps>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const listRef = useRef<HTMLDivElement>(null);

    // The list changes on every keystroke as the query narrows; keep the highlight in range.
    useEffect(() => setSelected(0), [items]);

    // The list is taller than the popup; keep the keyboard-highlighted item in view, together with its
    // group heading when it's the first item of a group (e.g. after wrapping back to the top).
    // Scrolls only the list itself: scrollIntoView would also scroll the page, and on the first render the
    // popup isn't positioned yet, so the page jumped to wherever the unpositioned popup sat (its bottom).
    useEffect(() => {
      const list = listRef.current;
      const el = itemRefs.current[selected];
      if (!list || !el) return;
      const heading = items[selected]?.group !== items[selected - 1]?.group ? (el.previousElementSibling as HTMLElement | null) : null;
      const top = (heading ?? el).offsetTop;
      const bottom = el.offsetTop + el.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
    }, [selected, items]);

    useImperativeHandle(ref, () => ({
      onKeyDown(event) {
        // Nothing to pick (e.g. "/usr/local" typed at line start): let the editor handle Enter and arrows normally.
        if (items.length === 0) return false;
        if (event.key === "ArrowDown") {
          setSelected((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setSelected((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          const item = items[selected];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="w-64 rounded-lg border bg-popover p-3 text-sm text-muted-foreground shadow-md">
          일치하는 명령이 없어요
        </div>
      );
    }

    return (
      // relative: item offsetTop is measured from this scroll container.
      <div ref={listRef} className="relative max-h-80 w-64 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
        {items.map((item, index) => (
          <Fragment key={item.title}>
            {/* Headings are just labels; arrow keys still move through the items as one flat list. */}
            {item.group !== items[index - 1]?.group && (
              <div className={cn("px-2 pb-1 text-[11px] font-medium text-muted-foreground", index === 0 ? "pt-1" : "pt-2.5")}>
                {item.group}
              </div>
            )}
            <button
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              type="button"
              // Keep the editor selection alive; a normal mousedown would blur the editor before the click fires.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setSelected(index)}
              onClick={() => command(item)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm",
                index === selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                <item.icon size={16} />
              </span>
              <span className="flex flex-col overflow-hidden">
                <span className="truncate font-medium">{item.title}</span>
                <span className="truncate text-xs text-muted-foreground">{item.description}</span>
              </span>
            </button>
          </Fragment>
        ))}
      </div>
    );
  },
);
SlashCommandMenu.displayName = "SlashCommandMenu";
