"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface OGData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
}

interface OgPreviewCardProps {
  url: string;
}

export function OgPreviewCard({ url }: OgPreviewCardProps) {
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!url) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (isMounted) {
          setOgData(data);
        }
      } catch (error) {
        console.error("Failed to fetch OG data", error);
        if (isMounted) {
          setOgData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4 my-2">
        <Skeleton className="h-24 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!ogData || (!ogData.title && !ogData.description)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline my-2 block"
      >
        {url}
      </a>
    );
  }

  return (
    <a
      href={ogData.url}
      target="_blank"
      rel="noopener noreferrer"
      className="not-prose block"
    >
      <Card className="my-4 flex overflow-hidden transition-colors hover:bg-muted/50 h-24 md:h-30">
        {ogData.image && (
          <div className="w-20 h-24 md:w-30 md:h-30 flex-shrink-0 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogData.image}
              alt={ogData.title || "OG Image"}
              className="h-full object-cover"
            />
          </div>
        )}
        <div className="px-3 md:px-4 flex flex-col justify-center">
          {ogData.title && (
            <div className="text-xs md:text-sm font-semibold line-clamp-1">
              {ogData.title}
            </div>
          )}
          {ogData.description && (
            <div className="text-[0.7rem] md:text-xs text-muted-foreground line-clamp-2 mt-1">
              {ogData.description}
            </div>
          )}
          <div className="text-[0.7rem] md:text-xs text-xs text-muted-foreground mt-1 line-clamp-1">
            {ogData.url}
          </div>
        </div>
      </Card>
    </a>
  );
}
