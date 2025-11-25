"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, memo, useRef } from "react";
import { linkifyMentions } from "@/lib/utils";
import { OgPreviewCard } from "@/components/common/og-preview-card";
import { LoadingSpinner } from "@/components/ui/loading-states";

interface ShowcaseCardContentProps {
  showcase: {
    id: string;
    content: string;
    image_url: string | null;
  };
  mentionedProfiles: Array<{ id: string; username: string | null }>;
  searchQuery?: string;
  isDetailPage: boolean;
  onCardClick: () => void;
}

function ShowcaseCardContentBase({
  showcase,
  mentionedProfiles,
  searchQuery,
  isDetailPage,
  onCardClick,
}: ShowcaseCardContentProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isClamped, setIsClamped] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = showcase.content.match(urlRegex);
    if (match) {
      setPreviewUrl(match[0]);
    }
  }, [showcase.content]);

  useEffect(() => {
    if (contentRef.current && !isDetailPage) {
      // Check if line-clamp is actually truncating the content
      setIsClamped(
        contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    }
  }, [showcase.content, isDetailPage]);

  return (
    <div
      onClick={onCardClick}
      className={`${!isDetailPage ? "cursor-pointer" : ""} py-1 pl-[44px]`}
      style={{ marginTop: "-12px" }}
    >
      <div className="mb-3 relative">
        <p
          ref={contentRef}
          className="text-sm md:text-showcase-content whitespace-pre-wrap"
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
          {linkifyMentions(showcase.content, mentionedProfiles, searchQuery)}
        </p>
        {isClamped && !isDetailPage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/showcase/${showcase.id}`);
            }}
            className="text-gray-500 hover:text-gray-700 text-sm md:text-showcase-content absolute bottom-0 right-0 bg-card pl-4"
          >
            ...더 보기
          </button>
        )}
      </div>
      {previewUrl && !showcase.image_url && (
        <div className="mt-3">
          <OgPreviewCard url={previewUrl} />
        </div>
      )}
      {showcase.image_url && (
        <div
          className="relative w-full mt-3 rounded-md overflow-hidden bg-sydenightblue"
          style={{ aspectRatio: "16 / 9" }}
        >
          <Image
            src={showcase.image_url}
            alt="Showcase image"
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

export const ShowcaseCardContent = memo(
  ShowcaseCardContentBase,
  (prevProps, nextProps) => {
    return (
      prevProps.showcase.id === nextProps.showcase.id &&
      prevProps.showcase.content === nextProps.showcase.content &&
      prevProps.showcase.image_url === nextProps.showcase.image_url &&
      prevProps.searchQuery === nextProps.searchQuery &&
      prevProps.isDetailPage === nextProps.isDetailPage &&
      JSON.stringify(prevProps.mentionedProfiles) ===
        JSON.stringify(nextProps.mentionedProfiles)
    );
  }
);

ShowcaseCardContent.displayName = "ShowcaseCardContent";
