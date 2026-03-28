"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTrendingShowcases, TrendingShowcase } from "@/app/showcase/trending-actions";
import { ChevronUp } from "lucide-react";

// Assuming there's a generic Skeleton component or we can just use plain divs for skeleton
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 ${className}`} />;
}

export function TrendingShowcases() {
  const [showcases, setShowcases] = useState<TrendingShowcase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTrendingShowcases();
        setShowcases(data);
      } catch (error) {
        console.error("Failed to fetch trending showcases");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <h3 className="font-pretendard font-bold text-[16px] text-gray-900 mb-4">지금 주목받는 🚀</h3>
        <div className="flex flex-col gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-[14px] h-[20px] rounded" />
              <Skeleton className="w-[40px] h-[40px] rounded-lg flex-shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-[14px] w-3/4 rounded" />
                <Skeleton className="h-[12px] w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showcases.length === 0) {
    return null; // Don't render if there are no trending showcases
  }

  // Display top 5 max for UI
  const displayShowcases = showcases.slice(0, 5);

  return (
    <div className="w-full">
      <h3 className="font-pretendard font-bold text-[16px] leading-[19px] tracking-[-0.02em] text-[#111111] mb-5 flex items-center gap-2">
        지금 주목받는 프로젝트 🚀
      </h3>
      <div className="flex flex-col gap-[18px]">
        {displayShowcases.map((showcase, index) => (
          <Link href={`/showcase/${showcase.id}`} key={showcase.id} className="block group">
            <div className="flex items-center gap-2">
              <span className="font-pretendard font-bold text-[14px] w-[14px] text-center text-sydeblue">
                {index + 1}
              </span>
              
              <div className="w-[40px] h-[40px] rounded-[8px] overflow-hidden flex-shrink-0 border border-[#EEEEEE] relative bg-[#F8F9FA]">
                {showcase.thumbnail_url ? (
                  <Image src={showcase.thumbnail_url} alt={showcase.name || "Thumbnail"} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-[#AAAAAA]">No Img</div>
                )}
              </div>
              
              <div className="flex flex-col flex-1 min-w-0 justify-center gap-0.5">
                <span className="font-pretendard font-semibold text-[14px] leading-[17px] text-sydeblue truncate transition-colors">
                  {showcase.name}
                </span>
                {showcase.short_description && (
                  <span className="font-pretendard font-medium text-[12px] leading-[14px] text-[#777777] truncate">
                    {showcase.short_description}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
