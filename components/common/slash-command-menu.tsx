"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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

    // The list changes on every keystroke as the query narrows; keep the highlight in range.
    useEffect(() => setSelected(0), [items]);

    // The list is taller than the popup; keep the keyboard-highlighted item in view.
    useEffect(() => {
      itemRefs.current[selected]?.scrollIntoView({ block: "nearest" });
    }, [selected]);

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
      <div className="max-h-80 w-64 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
        {items.map((item, index) => (
          <button
            key={item.title}
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
        ))}
      </div>
    );
  },
);
SlashCommandMenu.displayName = "SlashCommandMenu";
