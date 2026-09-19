"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
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

const COPIED_LABEL_MS = 1500;

/**
 * Displays server-rendered editor content without shipping the editor to readers.
 * Link-preview anchors are upgraded in place to OG cards after hydration.
 */
export default function RichContent({ html, className = "prose max-w-none" }: RichContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<LinkPreviewSlot[]>([]);
  const copyTimers = useRef(new Set<number>());
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

  // Reader-side chrome on top of the static HTML: a "#" link on headings that have an id, and a language
  // label + copy button on code blocks. Marked with data attributes so effect re-runs don't stack duplicates.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    root.querySelectorAll<HTMLElement>("h1[id], h2[id], h3[id]").forEach((heading) => {
      if (heading.dataset.anchorReady) return;
      heading.dataset.anchorReady = "true";
      const anchor = document.createElement("a");
      anchor.href = `#${encodeURIComponent(heading.id)}`;
      anchor.className = "heading-anchor";
      anchor.setAttribute("aria-label", "이 섹션 링크");
      anchor.textContent = "#";
      heading.append(anchor);
    });

    root.querySelectorAll<HTMLElement>("pre").forEach((pre) => {
      if (pre.dataset.copyReady) return;
      pre.dataset.copyReady = "true";
      // The pre scrolls sideways on long lines, so anything inside it would scroll away too; hang the
      // label and button on a fixed wrapper instead.
      const wrapper = document.createElement("div");
      wrapper.className = "code-block";
      pre.replaceWith(wrapper);
      wrapper.append(pre);
      const language = pre.querySelector("code")?.className.match(/language-([\w+#-]+)/)?.[1];
      if (language) {
        const label = document.createElement("span");
        label.className = "code-lang-label";
        label.textContent = language;
        wrapper.append(label);
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy-btn";
      button.textContent = "복사";
      wrapper.append(button);
    });
  }, [innerHtml]);

  useEffect(() => {
    const timers = copyTimers.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const handleClick = async (event: MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".code-copy-btn");
    if (!button) return;
    const code = button.closest(".code-block")?.querySelector("code")?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = "복사됨";
    } catch {
      button.textContent = "복사 실패";
    }
    const timer = window.setTimeout(() => {
      button.textContent = "복사";
      copyTimers.current.delete(timer);
    }, COPIED_LABEL_MS);
    copyTimers.current.add(timer);
  };

  return (
    <>
      <div ref={ref} className={className} dangerouslySetInnerHTML={innerHtml} onClick={handleClick} />
      {slots.map((slot, index) => createPortal(<OgPreviewCard url={slot.url} />, slot.holder, `${index}-${slot.url}`))}
    </>
  );
}
