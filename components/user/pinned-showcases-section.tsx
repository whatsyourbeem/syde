"use client";

import { useState } from "react";
import Link from "next/link";
import { ShowcaseThumbnail } from "@/components/showcase/showcase-thumbnail";
import { OptimizedShowcase } from "@/lib/queries/showcase-queries";
import { PinnedShowcasesEditor } from "@/components/user/pinned-showcases-editor";

interface PinnedShowcasesSectionProps {
  userId: string;
  isOwnProfile: boolean;
  initialShowcases: OptimizedShowcase[];
}

export function PinnedShowcasesSection({
  userId,
  isOwnProfile,
  initialShowcases,
}: PinnedShowcasesSectionProps) {
  const [showcases, setShowcases] = useState(initialShowcases);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <div className="px-5 py-4 md:px-8 md:py-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>📌</span>
          <span className="font-bold text-base text-black">대표 프로젝트</span>
        </div>
        {isOwnProfile && (
          <button
            onClick={() => setIsEditorOpen(true)}
            className="text-sydeorange text-[13px] font-bold hover:opacity-80 transition-opacity"
          >
            편집
          </button>
        )}
      </div>

      {showcases.length === 0 ? (
        <div className="flex items-center justify-center h-[81px] text-center px-4 bg-[#FAFAFA] rounded-xl">
          <p className="text-[#777777] text-sm font-light leading-[150%]">
            아직 등록된 쇼케이스가 없어요.
            <br />
            당신의 멋진 프로덕트를 이곳에 보여주세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {showcases.map((showcase) => (
            <Link
              key={showcase.id}
              href={`/showcase/${showcase.slug || showcase.id}`}
              prefetch={false}
              className="flex flex-col gap-2 group"
            >
              <ShowcaseThumbnail
                src={showcase.thumbnail_url}
                alt={showcase.name || ""}
                containerClassName="w-full aspect-square rounded-xl"
                className="group-hover:scale-105 transition-transform duration-300"
                status={showcase.status}
                statusSize="sm"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-black line-clamp-1">
                  {showcase.name}
                </span>
                <span className="text-[11px] text-[#777777] line-clamp-1">
                  {showcase.short_description}
                </span>
                <span className="text-[11px] text-[#777777]">
                  ▲ {showcase.upvotesCount} · 조회 {showcase.views_count || 0}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isOwnProfile && (
        <PinnedShowcasesEditor
          userId={userId}
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          currentPinnedIds={showcases.map((s) => s.id)}
          onSaved={setShowcases}
        />
      )}
    </div>
  );
}
