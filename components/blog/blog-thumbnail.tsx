"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BlogThumbnailProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  unoptimized?: boolean;
  /** Render nothing (instead of the mascot placeholder) when the post has no image. */
  hideWhenEmpty?: boolean;
}

export function BlogThumbnail({
  src,
  alt,
  fill = true,
  width,
  height,
  className,
  containerClassName,
  unoptimized = true,
  hideWhenEmpty = false,
}: BlogThumbnailProps) {
  if (hideWhenEmpty && !src) return null;
  const imageUrl = src || "/default_blog_thumbnail.png";

  return (
    <div className={cn("relative overflow-hidden bg-[#222E35]", containerClassName)}>
      <Image
        src={imageUrl}
        alt={alt || "Blog Thumbnail"}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn("object-cover", className)}
        unoptimized={unoptimized}
      />
    </div>
  );
}
