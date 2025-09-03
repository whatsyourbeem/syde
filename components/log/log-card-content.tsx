"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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

export function LogCardContent({ 
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
  const [ogUrl, setOgUrl] = useState<string | null>(null);

  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = log.content.match(urlRegex);
    if (match) {
      setOgUrl(match[0]);
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
      {ogUrl && !log.image_url && (
        <div className="mt-3">
          <OgPreviewCard url={ogUrl} />
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
          />
        </div>
      )}
    </div>
  );
}