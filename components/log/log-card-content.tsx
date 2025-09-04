"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, memo } from "react";
import { linkifyMentions } from "@/lib/utils";
import { OgPreviewCard } from "@/components/common/og-preview-card";

interface LogCardContentProps {
  log: {
    id: string;
    content: string;
    image_url: string | null;
  };
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  searchQuery?: string;
  isDetailPage: boolean;
  onCardClick: () => void;
  showReadMore: boolean;
}

function LogCardContentBase({ 
  log, 
  mentionedProfiles, 
  searchQuery, 
  isDetailPage, 
  onCardClick,
  showReadMore 
}: LogCardContentProps) {
  const router = useRouter();
  const [imageStyle, setImageStyle] = useState<{
    width?: string;
    height?: string;
    aspectRatio?: string;
    objectFit: "cover" | "contain";
    margin?: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = log.content.match(urlRegex);
    if (match) {
      setPreviewUrl(match[0]);
    }
  }, [log.content]);

  useEffect(() => {
    if (log.image_url) {
      const img = new window.Image();
      img.src = log.image_url;
      img.onload = () => {
        if (img.naturalHeight > 0) {
          const originalAspectRatio = img.naturalWidth / img.naturalHeight;
          const targetAspectRatio = 3 / 4;

          if (originalAspectRatio < targetAspectRatio) {
            setImageStyle({
              width: "300px",
              height: "400px",
              objectFit: "cover",
              margin: "0 auto",
            });
          } else {
            setImageStyle({
              aspectRatio: `${originalAspectRatio}`,
              objectFit: "contain",
            });
          }
        }
      };
      img.onerror = () => {
        setImageStyle(null);
      };
    } else {
      setImageStyle(null);
    }
  }, [log.image_url]);

  return (
    <div 
      onClick={onCardClick} 
      className={`${!isDetailPage ? 'cursor-pointer' : ''} py-1 pl-[44px] relative`} 
      style={{ marginTop: '-12px' }}
    >
      <p className={`mb-3 text-log-content whitespace-pre-wrap ${!isDetailPage ? 'overflow-hidden max-h-72' : ''}`}>
        {linkifyMentions(log.content, mentionedProfiles, searchQuery)}
      </p>
      {showReadMore && !isDetailPage && (
        <div className="absolute bottom-0 right-0 bg-gradient-to-l from-card to-transparent pl-10 pr-5 pt-2 pb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/log/${log.id}`);
            }}
            className="text-blue-500 hover:underline text-sm font-semibold"
          >
            ... 더보기
          </button>
        </div>
      )}
      {previewUrl && !log.image_url && (
        <div className="mt-3">
          <OgPreviewCard url={previewUrl} />
        </div>
      )}
      {log.image_url && (
        <div
          className="relative w-full mt-3 rounded-md overflow-hidden max-h-[400px]"
          style={imageStyle ? { ...imageStyle } : {}}
        >
          <Image
            src={log.image_url}
            alt="Log image"
            fill
            style={{ objectFit: imageStyle?.objectFit || "contain" }}
            sizes="(max-width: 768px) 100vw, 672px"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSenFhJyKcNULi2YXKR0iOgzL2BPUv8ApK8/U5TK/vQNI/G6h+vp/n4NMgNS4i0HUk+y1xQ8cVc4LxstNu/WXWj0WLtNNPQGa3c3aSc="
          />
        </div>
      )}
    </div>
  );
}

export const LogCardContent = memo(LogCardContentBase, (prevProps, nextProps) => {
  return (
    prevProps.log.id === nextProps.log.id &&
    prevProps.log.content === nextProps.log.content &&
    prevProps.log.image_url === nextProps.log.image_url &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.isDetailPage === nextProps.isDetailPage &&
    prevProps.showReadMore === nextProps.showReadMore &&
    JSON.stringify(prevProps.mentionedProfiles) === JSON.stringify(nextProps.mentionedProfiles)
  );
});

LogCardContent.displayName = 'LogCardContent';