"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { SHOWCASE_STATUSES, type ShowcaseStatus } from "@/lib/constants";
import {
  ShowcaseStatusOverlay,
  type ShowcaseStatusOverlaySize,
} from "./showcase-status-overlay";

interface ShowcaseThumbnailProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  unoptimized?: boolean;
  /** 넘기면 이미지 하단에 진행 상태 오버레이를 얹는다. */
  status?: ShowcaseStatus | null;
  statusSize?: ShowcaseStatusOverlaySize;
}

export function ShowcaseThumbnail({
  src,
  alt,
  fill = true,
  width,
  height,
  className,
  containerClassName,
  unoptimized = true,
  status,
  statusSize = "sm",
}: ShowcaseThumbnailProps) {
  const imageUrl = src || "/default_showcase_thumbnail.png";
  // 종료된 프로젝트는 이미지 채도를 빼서 "보관됨"으로 읽히게 한다.
  const isEnded = status === SHOWCASE_STATUSES.ENDED;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#f0f0f0]",
        // 호버 시 상태 이름을 띄우기 위한 이름 있는 그룹
        status && "group/thumb",
        containerClassName,
      )}
    >
      <Image
        src={imageUrl}
        alt={alt || "Showcase Thumbnail"}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn(
          "object-cover",
          isEnded && "grayscale-[0.7] opacity-[0.85]",
          className,
        )}
        unoptimized={unoptimized}
      />
      <ShowcaseStatusOverlay status={status} size={statusSize} />
    </div>
  );
}
