"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** 다음 페이지 요청이 실패한 상태. 자동 재요청을 멈추고 다시 시도 버튼을 보여준다. */
  isError?: boolean;
  rootMargin?: string;
}

/**
 * 목록 하단에 두면 화면에 가까워질 때 다음 페이지를 불러오는 센티넬.
 * 요청이 끝난 뒤에도 센티넬이 화면에 남아 있으면 옵저버를 새로 만들어 다시 확인한다.
 * 요청이 실패하면 같은 요청을 무한히 반복하지 않도록 멈추고 버튼으로만 재시도한다.
 */
export function InfiniteScrollTrigger({
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  isError = false,
  rootMargin = "400px",
}: InfiniteScrollTriggerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNextPage || isFetchingNextPage || isError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMoreRef.current();
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, rootMargin]);

  if (!hasNextPage) return null;

  return (
    <div
      ref={ref}
      className="flex justify-center py-8 text-[0.875rem] text-[#777777]"
      aria-live="polite"
    >
      {isFetchingNextPage ? (
        "불러오는 중..."
      ) : isError ? (
        <button
          type="button"
          onClick={() => onLoadMoreRef.current()}
          className="underline underline-offset-2 hover:text-black"
        >
          불러오지 못했어요. 다시 시도
        </button>
      ) : null}
    </div>
  );
}
