import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import {
  SHOWCASE_STATUSES,
  SHOWCASE_STATUS_DISPLAY_NAMES,
  type ShowcaseStatus,
} from "@/lib/constants";

export type ShowcaseStatusOverlaySize = "xs" | "sm";

interface ShowcaseStatusOverlayProps {
  status: ShowcaseStatus | null | undefined;
  /** xs: 64px 이하 썸네일 / sm: 72~120px */
  size?: ShowcaseStatusOverlaySize;
  className?: string;
}

/** 상태별 점 색. 제작 중은 서비스 포인트 컬러(sydeorange)를 그대로 쓴다. */
const DOT_COLORS: Record<ShowcaseStatus, string> = {
  [SHOWCASE_STATUSES.DEVELOPING]: "#ED6D34",
  [SHOWCASE_STATUSES.IN_SERVICE]: "#2FBF71",
  [SHOWCASE_STATUSES.ENDED]: "#9AA1AA",
};

/** 점 지름 / 모서리에서 띄우는 간격 (px) */
const DOT_METRICS: Record<
  ShowcaseStatusOverlaySize,
  { size: number; offset: number }
> = {
  xs: { size: 3, offset: 3 },
  sm: { size: 4, offset: 5 },
};

/** 라벨을 띄울 공간이 없는 xs 는 호버 라벨을 생략한다. */
const LABEL_STYLES: Record<ShowcaseStatusOverlaySize, string | null> = {
  xs: null,
  sm: "text-[9px] px-1.5 pb-[5px] pt-3",
};

/**
 * 우상단 상태 점.
 * 테두리 없이 색만 찍고, 밝은 이미지 위에서 형태만 잡아주는 옅은 그림자를 둔다.
 */
function dotStyle(
  status: ShowcaseStatus,
  size: ShowcaseStatusOverlaySize,
): CSSProperties {
  const { size: dot, offset } = DOT_METRICS[size];

  return {
    width: dot,
    height: dot,
    top: offset,
    right: offset,
    backgroundColor: DOT_COLORS[status],
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
  };
}

/**
 * 진행 상태 표시. 평소에는 우상단 점만 찍고,
 * 호버했을 때만 상태 이름이 떠오른다.
 */
export function ShowcaseStatusOverlay({
  status,
  size = "sm",
  className,
}: ShowcaseStatusOverlayProps) {
  if (!status) return null;

  const labelStyle = LABEL_STYLES[size];
  const label = SHOWCASE_STATUS_DISPLAY_NAMES[status];

  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-20 rounded-full"
        style={dotStyle(status, size)}
      />

      {labelStyle && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end",
            "bg-gradient-to-t from-black/80 to-transparent font-medium text-white",
            "opacity-0 transition-opacity duration-200 group-hover/thumb:opacity-100",
            labelStyle,
            className,
          )}
        >
          <span className="truncate leading-none">{label}</span>
        </span>
      )}

      <span className="sr-only">진행 상태: {label}</span>
    </>
  );
}
