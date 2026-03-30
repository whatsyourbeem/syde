"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface InsightThumbnailProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  unoptimized?: boolean;
}

export function InsightThumbnail({
  src,
  alt,
  fill = true,
  width,
  height,
  className,
  containerClassName,
  unoptimized = true,
}: InsightThumbnailProps) {
  const imageUrl = src || "/default_insight_thumbnail.png";

  return (
    <div className={cn("relative overflow-hidden bg-[#222E35]", containerClassName)}>
      <Image
        src={imageUrl}
        alt={alt || "Insight Thumbnail"}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn("object-cover", className)}
        unoptimized={unoptimized}
      />
    </div>
  );
}
