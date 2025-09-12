"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, memo } from "react";
import { linkifyMentions } from "@/lib/utils";
import { OgPreviewCard } from "@/components/common/og-preview-card";
import { LoadingSpinner } from "@/components/ui/loading-states";

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
  showReadMore,
}: LogCardContentProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = log.content.match(urlRegex);
    if (match) {
      setPreviewUrl(match[0]);
    }
  }, [log.content]);

  return (
    <div
      onClick={onCardClick}
      className={`${
        !isDetailPage ? "cursor-pointer" : ""
      } py-1 pl-[44px] relative`}
      style={{ marginTop: "-12px" }}
    >
      <p
        className={`mb-3 text-sm md:text-log-content whitespace-pre-wrap ${
          !isDetailPage ? "overflow-hidden max-h-72" : ""
        }`}
      >
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
          className="relative w-full mt-3 rounded-md overflow-hidden bg-sydenightblue"
          style={{ aspectRatio: "16 / 9" }}
        >
          <Image
            src={log.image_url}
            alt="Log image"
            fill
            style={{ objectFit: "contain" }}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAAAAAAB/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAERAv/aAAwDAQACEQMRAD8A0XmIuxHfFYGfyAP/2Q=="
            onLoad={() => setIsImageLoading(false)}
          />
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="md" className="text-white" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const LogCardContent = memo(
  LogCardContentBase,
  (prevProps, nextProps) => {
    return (
      prevProps.log.id === nextProps.log.id &&
      prevProps.log.content === nextProps.log.content &&
      prevProps.log.image_url === nextProps.log.image_url &&
      prevProps.searchQuery === nextProps.searchQuery &&
      prevProps.isDetailPage === nextProps.isDetailPage &&
      prevProps.showReadMore === nextProps.showReadMore &&
      JSON.stringify(prevProps.mentionedProfiles) ===
        JSON.stringify(nextProps.mentionedProfiles)
    );
  }
);

LogCardContent.displayName = "LogCardContent";
