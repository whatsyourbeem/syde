"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  rootMargin?: string;
}

/**
 * 목록 하단에 두면 화면에 가까워질 때 다음 페이지를 불러오는 센티넬.
 * 요청이 끝난 뒤에도 센티넬이 화면에 남아 있으면 옵저버를 새로 만들어 다시 확인한다.
 */
export function InfiniteScrollTrigger({
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  rootMargin = "400px",
}: InfiniteScrollTriggerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMoreRef.current();
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, rootMargin]);

  if (!hasNextPage) return null;

  return (
    <div
      ref={ref}
      className="flex justify-center py-8 text-[0.875rem] text-[#777777]"
      aria-live="polite"
    >
      {isFetchingNextPage ? "불러오는 중..." : null}
    </div>
  );
}
