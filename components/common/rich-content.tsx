"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { OgPreviewCard } from "./og-preview-card";

interface RichContentProps {
  /** HTML produced by `getInitialHtmlFromTiptap` on the server. */
  html: string;
  className?: string;
}

interface LinkPreviewSlot {
  holder: HTMLElement;
  url: string;
}

/**
 * Displays server-rendered editor content without shipping the editor to readers.
 * Link-preview anchors are upgraded in place to OG cards after hydration.
 */
export default function RichContent({ html, className = "prose max-w-none" }: RichContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<LinkPreviewSlot[]>([]);
  // React re-applies innerHTML whenever this object's identity changes, which would wipe the preview holders on every render.
  const innerHtml = useMemo(() => ({ __html: html }), [html]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    setSlots(
      Array.from(root.querySelectorAll<HTMLAnchorElement>('a[data-type="link-preview"]')).map((anchor) => {
        // Reuse the holder on effect re-runs (e.g. StrictMode) instead of stacking duplicates.
        let holder = anchor.nextElementSibling as HTMLElement | null;
        if (!holder?.dataset.linkPreviewHolder) {
          holder = document.createElement("div");
          holder.dataset.linkPreviewHolder = "true";
          holder.className = "not-prose";
          anchor.after(holder);
        }
        anchor.hidden = true;
        return { holder, url: anchor.href };
      }),
    );
  }, [innerHtml]);

  return (
    <>
      <div ref={ref} className={className} dangerouslySetInnerHTML={innerHtml} />
      {slots.map((slot, index) => createPortal(<OgPreviewCard url={slot.url} />, slot.holder, `${index}-${slot.url}`))}
    </>
  );
}
