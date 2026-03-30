"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ShowcaseThumbnailProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  unoptimized?: boolean;
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
}: ShowcaseThumbnailProps) {
  const imageUrl = src || "/default_showcase_thumbnail.png";

  return (
    <div className={cn("relative overflow-hidden bg-[#f0f0f0]", containerClassName)}>
      <Image
        src={imageUrl}
        alt={alt || "Showcase Thumbnail"}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn("object-cover", className)}
        unoptimized={unoptimized}
      />
    </div>
  );
}
