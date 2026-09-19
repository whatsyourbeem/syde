"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/components/common/tiptap-server-extensions";

const MIN_HEADINGS = 3;

interface ArticleTocProps {
  items: TocItem[];
}

function useActiveHeading(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const headings = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (headings.length === 0) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id)));
        // The topmost heading inside the reading zone wins; when none is inside it, keep the last one.
        const first = headings.find((h) => visible.has(h.id));
        if (first) setActiveId(first.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

function TocList({ items, activeId, onNavigate }: { items: TocItem[]; activeId: string | null; onNavigate?: () => void }) {
  const goTo = (event: React.MouseEvent, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    // Collapse first: closing the mobile outline shifts everything below it, so measure after.
    onNavigate?.();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${encodeURIComponent(id)}`);
  };

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
          <a
            href={`#${encodeURIComponent(item.id)}`}
            onClick={(event) => goTo(event, item.id)}
            aria-current={activeId === item.id ? "location" : undefined}
            className={cn(
              "block rounded-md py-1 pr-1 text-[13px] leading-snug transition-colors line-clamp-2",
              activeId === item.id ? "font-semibold text-sydeblue" : "text-[#888] hover:text-sydeblue",
            )}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Outline of a long post. Beside the body on wide screens (sticky, current section highlighted),
 * a collapsed "목차" above the body otherwise. Short posts (< 3 headings) get nothing.
 */
export function ArticleToc({ items }: ArticleTocProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const activeId = useActiveHeading(ids.length >= MIN_HEADINGS ? ids : []);

  if (items.length < MIN_HEADINGS) return null;

  return (
    <>
      <details
        ref={detailsRef}
        className="xl:hidden mb-8 rounded-[10px] border border-[#E5E5E5] px-4 py-2 group"
      >
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-[14px] font-semibold text-sydeblue">
          목차
          <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="pb-2 pt-1">
          <TocList items={items} activeId={activeId} onNavigate={() => detailsRef.current?.removeAttribute("open")} />
        </div>
      </details>

      {/* Wide screens: hangs off the right edge of the 768px column without moving it. */}
      <aside className="hidden xl:block absolute left-[calc(100%+32px)] top-0 h-full w-[180px]" aria-label="목차">
        <nav className="sticky top-[calc(var(--sticky-nav-height,0px)+24px)]">
          <p className="mb-2 text-[12px] font-semibold text-[#999]">목차</p>
          <TocList items={items} activeId={activeId} />
        </nav>
      </aside>
    </>
  );
}
