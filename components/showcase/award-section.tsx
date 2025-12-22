import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Heart, Share2, Bookmark } from "lucide-react";

// Mock Data for Award Item
const AWARD_ITEM = {
  id: "mock-award-1",
  title: "일이삼사오육칠팔구십일이삼사..",
  thumbnailUrl: null, // Placeholder
  description: "이 프로덕트는 이렇고 저렇고 그렇습니다...",
  author: {
    name: "제이현",
    avatarUrl: null, // Placeholder
    tagline: "사이드프로젝트 | 제너럴리스트",
  },
  stats: {
    likes: 1342,
    comments: 342,
    shares: 0,
    bookmarks: 23,
  },
  awardDate: "2025 11.",
};

export function AwardSection() {
  return (
    <div className="flex flex-col items-center mt-8">
      {/* Award Title Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🏆</span>
        <div className="text-center">
          <p className="text-amber-500 font-bold text-sm tracking-widest">
            {AWARD_ITEM.awardDate}
          </p>
          <h3 className="text-amber-500 font-extrabold text-lg leading-tight">
            SYDE AWARDS
          </h3>
        </div>
        <span className="text-2xl">🏆</span>
      </div>

      {/* Award Card */}
      <div className="w-full bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3">
          {/* Thumbnail */}
          <div className="w-full aspect-square bg-gray-900 rounded-[16px] flex items-center justify-center text-white">
            {/* Placeholder for thumbnail */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 bg-white rounded-md mb-1 opacity-80"></div>
              <span className="text-[10px]">THUMBNAIL</span>
            </div>
          </div>

          {/* Content */}
          <div>
            <h4 className="font-bold text-base truncate mb-1">
              {AWARD_ITEM.title}
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                {/* Author Avatar Placeholder */}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold">
                  {AWARD_ITEM.author.name}
                </span>
                <span className="text-[10px] text-gray-500">
                  {AWARD_ITEM.author.tagline}
                </span>
              </div>
            </div>
          </div>

          {/* Divider with requested blue dots style */}
          <div className="w-full border-t-2 border-dotted border-blue-200 my-1"></div>

          {/* Stats (Simplified for Sidebar) */}
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-1 text-gray-400">
              <Heart className="w-4 h-4" />
              <span className="text-xs">{AWARD_ITEM.stats.likes}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{AWARD_ITEM.stats.comments}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
