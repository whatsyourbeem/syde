"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { linkPreviewNode, toHttpUrlLenient, youtubeNode } from "./tiptap-embed";
import type { EmbedKind } from "./tiptap-slash-command";

const COPY: Record<EmbedKind, { placeholder: string; error: string }> = {
  youtube: { placeholder: "유튜브 영상 주소 (youtu.be/…)", error: "유튜브 영상 주소를 입력해주세요." },
  bookmark: { placeholder: "링크 주소 (https://…)", error: "올바른 링크 주소를 입력해주세요." },
};

interface AnchorRect {
  top: number;
  left: number;
  height: number;
}

/**
 * Asks for the URL of a YouTube video or link card (from the "/" menu or the toolbar) and inserts
 * the block at the caret — the same blocks a pasted URL on an empty line turns into.
 */
export function EmbedPrompt({ editor, kind, onClose }: { editor: Editor; kind: EmbedKind | null; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  useEffect(() => {
    if (!kind) return;
    setValue("");
    setError(false);
    // Anchor the popover to the caret, where the block will land.
    const rect = editor.view.coordsAtPos(editor.state.selection.from);
    setAnchor({ top: rect.top, left: rect.left, height: rect.bottom - rect.top });
  }, [kind, editor]);

  const close = () => {
    onClose();
    editor.commands.focus();
  };

  const apply = () => {
    if (!kind) return;
    const url = toHttpUrlLenient(value);
    const node = url && (kind === "youtube" ? youtubeNode(editor.schema, url) : linkPreviewNode(editor.schema, url));
    if (!node) {
      setError(true);
      return;
    }
    // Replaces the empty line the "/" command left behind, just like pasting a URL on an empty line.
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.replaceSelectionWith(node);
        return true;
      })
      .run();
    onClose();
  };

  if (!kind || !anchor) return null;

  return (
    <Popover open onOpenChange={(open) => !open && close()}>
      <PopoverAnchor asChild>
        <div aria-hidden className="pointer-events-none fixed w-px" style={anchor} />
      </PopoverAnchor>
      <PopoverContent align="start" className="w-80 p-3">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <Input
            autoFocus
            type="text"
            inputMode="url"
            placeholder={COPY[kind].placeholder}
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
            aria-label={kind === "youtube" ? "유튜브 영상 주소" : "링크 카드 주소"}
            aria-invalid={error}
            className={cn(error && "border-red-500 focus-visible:ring-red-500")}
          />
          {error && <p className="text-xs text-red-500">{COPY[kind].error}</p>}
          <div className="flex justify-end">
            <Button type="submit" size="sm">
              삽입
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
