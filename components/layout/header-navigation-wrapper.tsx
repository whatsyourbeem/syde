"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function HeaderNavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // 프로필 페이지 여부 판단 (/@username 형태)
  const segments = pathname.split("/").filter(Boolean);

  const isProfilePage =
    segments.length === 1 &&
    segments[0].startsWith("@");

  // Publishes the sticky nav height so sticky elements below it (e.g. editor toolbar) don't slide underneath.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--sticky-nav-height", `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(
      "w-full bg-background sticky top-0 z-40",
      isProfilePage ? "hidden md:block" : "block"
    )}>
      <nav className="md:h-auto w-full max-w-6xl mx-auto flex justify-center items-center px-5">
        {children}
      </nav>
      <Separator />
    </div>
  );
}
