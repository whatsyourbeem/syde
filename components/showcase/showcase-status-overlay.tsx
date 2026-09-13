import { cn } from "@/lib/utils";
import {
  SHOWCASE_STATUS_CHIP_LABELS,
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

/** 상태별 점 색. */
const DOT_COLORS: Record<ShowcaseStatus, string> = {
  DEVELOPING: "#FBBF24",
  IN_SERVICE: "#2FBF71",
  ENDED: "#EF4444",
};

/**
 * 진행 상태 표시. 썸네일 좌하단에 반투명 검은 배경의 "글래스 칩"으로
 * 점 + 상태 이름을 함께 보여준다. 공간이 부족한 xs 는 칩 없이 점만 찍는다.
 * 서비스중은 기본/무난한 상태라 칩을 아예 숨기고, 예외 상태(제작중/서비스종료)만 노출한다.
 */
export function ShowcaseStatusOverlay({
  status,
  size = "sm",
  className,
}: ShowcaseStatusOverlayProps) {
  if (!status || status === "IN_SERVICE") return null;

  const dotColor = DOT_COLORS[status];
  const chipLabel = SHOWCASE_STATUS_CHIP_LABELS[status];
  const fullLabel = SHOWCASE_STATUS_DISPLAY_NAMES[status];

  if (size === "xs") {
    return (
      <>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1 bottom-1 z-20 rounded-full"
          style={{
            width: 5,
            height: 5,
            backgroundColor: dotColor,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
          }}
        />
        <span className="sr-only">진행 상태: {fullLabel}</span>
      </>
    );
  }

  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-1.5 bottom-1.5 z-20 flex items-center gap-1 rounded-full bg-black/55 px-2 py-[3px]",
          className,
        )}
      >
        <span
          className="shrink-0 rounded-full"
          style={{ width: 5, height: 5, backgroundColor: dotColor }}
        />
        <span className="whitespace-nowrap text-[10px] font-medium leading-none text-white">
          {chipLabel}
        </span>
      </span>
      <span className="sr-only">진행 상태: {fullLabel}</span>
    </>
  );
}
