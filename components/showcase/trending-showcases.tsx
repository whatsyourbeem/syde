"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTrendingShowcases, TrendingShowcase } from "@/app/showcase/trending-actions";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Assuming there's a generic Skeleton component or we can just use plain divs for skeleton
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 ${className}`} />;
}

interface TrendingShowcasesProps {
  allowCollapse?: boolean;
}

export function TrendingShowcases({ allowCollapse = false }: TrendingShowcasesProps) {
  const [showcases, setShowcases] = useState<TrendingShowcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(!allowCollapse);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Ticker timer: cycle through top 5 every 4 seconds when collapsed
  useEffect(() => {
    if (isExpanded || showcases.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(showcases.length, 5));
    }, 4000);

    return () => clearInterval(interval);
  }, [isExpanded, showcases.length]);

  if (loading) {
    return (
      <div className={`w-full ${allowCollapse ? 'pt-4 pb-2 px-4 border-b border-gray-200' : ''}`}>
        <h3 className="font-pretendard font-bold text-[12px] lg:text-[14px] leading-[14px] lg:leading-[17px] text-gray-900 mb-2 lg:mb-3">지금 주목받는 🔥</h3>
        <div className="flex flex-col gap-4">
          {[...Array(isExpanded ? 5 : 1)].map((_, i) => (
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
    <div className={`w-full ${allowCollapse ? 'pt-4 pb-2 px-4 border-b border-gray-200' : ''}`}>
      <div className="flex items-center justify-between mb-2 lg:mb-3">
        <h3 className="font-pretendard font-bold text-[12px] lg:text-[14px] leading-[14px] lg:leading-[17px] tracking-[-0.02em] text-[#111111] flex items-center gap-2">
          지금 주목받는 프로젝트 🔥
        </h3>

        {allowCollapse && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[#777777] hover:text-[#333333] transition-colors"
          >
            <span className="text-[12px] font-medium">
              {isExpanded ? "접기" : "펼치기"}
            </span>
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
        )}
      </div>

      <div className="relative overflow-hidden">
        {isExpanded ? (
          <div className="flex flex-col gap-2 lg:gap-3">
            {displayShowcases.map((showcase, index) => (
              <div key={showcase.id}>
                <Link href={`/showcase/${showcase.id}`} className="block group">
                  <div className="flex items-center gap-2">
                    <span className="font-pretendard font-bold text-[14px] w-[14px] text-center text-sydeblue flex-shrink-0">
                      {index + 1}
                    </span>

                    <div className="w-[32px] h-[32px] lg:w-[40px] lg:h-[40px] rounded-[8px] overflow-hidden flex-shrink-0 border border-[#EEEEEE] relative bg-[#F8F9FA]">
                      {showcase.thumbnail_url ? (
                        <Image src={showcase.thumbnail_url} alt={showcase.name || "Thumbnail"} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#AAAAAA]">No Img</div>
                      )}
                    </div>

                    <div className="flex flex-row items-baseline lg:flex-col flex-1 min-w-0 lg:justify-center gap-1.5 lg:gap-0.5">
                      <span className="font-pretendard font-semibold text-[14px] leading-[17px] text-sydeblue truncate transition-colors flex-shrink-0 max-w-[120px] lg:max-w-none">
                        {showcase.name}
                      </span>
                      {showcase.short_description && (
                        <span className="font-pretendard font-medium text-[12px] leading-[14px] text-[#777777] truncate flex-1">
                          {showcase.short_description}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={displayShowcases[currentIndex]?.id || "ticker"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Link href={`/showcase/${displayShowcases[currentIndex].id}`} className="block group">
                <div className="flex items-center gap-2">
                  <span className="font-pretendard font-bold text-[14px] w-[14px] text-center text-sydeblue flex-shrink-0">
                    {currentIndex + 1}
                  </span>

                  <div className="w-[32px] h-[32px] lg:w-[40px] lg:h-[40px] rounded-[8px] overflow-hidden flex-shrink-0 border border-[#EEEEEE] relative bg-[#F8F9FA]">
                    {displayShowcases[currentIndex].thumbnail_url ? (
                      <Image src={displayShowcases[currentIndex].thumbnail_url!} alt={displayShowcases[currentIndex].name || "Thumbnail"} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#AAAAAA]">No Img</div>
                    )}
                  </div>

                  <div className="flex flex-row items-baseline lg:flex-col flex-1 min-w-0 lg:justify-center gap-1.5 lg:gap-0.5">
                    <span className="font-pretendard font-semibold text-[14px] leading-[17px] text-sydeblue truncate transition-colors flex-shrink-0 max-w-[120px] lg:max-w-none">
                      {displayShowcases[currentIndex].name}
                    </span>
                    {displayShowcases[currentIndex].short_description && (
                      <span className="font-pretendard font-medium text-[12px] leading-[14px] text-[#777777] truncate flex-1">
                        {displayShowcases[currentIndex].short_description}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
