"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, memo, useRef } from "react";
import { linkifyMentions, ensureSecureImageUrl } from "@/lib/utils";
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
}

function LogCardContentBase({
  log,
  mentionedProfiles,
  searchQuery,
  isDetailPage,
  onCardClick,
}: LogCardContentProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isClamped, setIsClamped] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = log.content.match(urlRegex);
    if (match) {
      setPreviewUrl(match[0]);
    }
  }, [log.content]);

  useEffect(() => {
    if (contentRef.current && !isDetailPage) {
      // Check if line-clamp is actually truncating the content
      setIsClamped(
        contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    }
  }, [log.content, isDetailPage]);

  return (
    <div
      onClick={onCardClick}
      className={`${!isDetailPage ? "cursor-pointer" : ""} py-1 pl-[44px]`}
      style={{ marginTop: "-12px" }}
    >
      <div className="mb-3 relative">
        <p
          ref={contentRef}
          className="text-sm md:text-log-content whitespace-pre-wrap"
          style={
            !isDetailPage
              ? ({
                  display: "-webkit-box",
                  WebkitLineClamp: 12,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  maxHeight: "18rem",
                } as React.CSSProperties)
              : {}
          }
        >
          {linkifyMentions(log.content, mentionedProfiles, searchQuery)}
        </p>
        {isClamped && !isDetailPage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/log/${log.id}`);
            }}
            className="text-gray-500 hover:text-gray-700 text-sm md:text-log-content absolute bottom-0 right-0 bg-card pl-4"
          >
            ...더 보기
          </button>
        )}
      </div>
      {previewUrl && !log.image_url && (
        <div className="mt-3">
          <OgPreviewCard url={previewUrl} />
        </div>
      )}
      {log.image_url && ensureSecureImageUrl(log.image_url) && (
        <div
          className="relative w-full mt-3 rounded-md overflow-hidden bg-sydenightblue"
          style={{ aspectRatio: "16 / 9" }}
        >
          <Image
            src={ensureSecureImageUrl(log.image_url)!}
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
      JSON.stringify(prevProps.mentionedProfiles) ===
        JSON.stringify(nextProps.mentionedProfiles)
    );
  }
);

LogCardContent.displayName = "LogCardContent";
