import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Heart, Bookmark, Share2 } from "lucide-react";

// Mock Data (Shared concept with Right Sidebar)
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

export function MainAwardBanner() {
  return (
    <div className="w-full mb-6">
      {/* Dark Blue Banner Container */}
      <div className="w-full bg-[#0F172A] p-6 md:p-8 relative overflow-hidden text-center">
        {/* Background Visual Elements (Spotlight Image) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/spotlight.png"
            alt="Spotlight Background"
            fill
            className="object-cover opacity-80"
            priority
          />
        </div>

        {/* Title Section */}
        <div className="relative z-10 flex items-center justify-center gap-4 mb-6">
          <Image
            src="/crown.png"
            alt="Laurel Left"
            width={32}
            height={32}
            className="w-8 h-8 md:w-10 md:h-10 object-contain transform scale-x-[-1]"
          />
          <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#BC572B] via-[#FF8D5B] to-[#BC572B] tracking-wider">
            {AWARD_ITEM.awardDate} SYDE AWARDS
          </h2>
          <Image
            src="/crown.png"
            alt="Laurel Right"
            width={32}
            height={32}
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          />
        </div>

        {/* Card Content */}
        <div className="relative z-10 bg-white rounded-[20px] p-5 text-left max-w-2xl mx-auto shadow-lg flex flex-col md:flex-row gap-5 items-start md:items-center">
          {/* Thumbnail */}
          <div className="w-full md:w-32 md:h-32 aspect-square bg-gray-900 rounded-[16px] flex-shrink-0 flex items-center justify-center text-white">
            {/* Placeholder */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 bg-white rounded-md mb-1 opacity-80"></div>
              <span className="text-[10px]">THUMBNAIL</span>
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 w-full">
            <h3 className="font-bold text-lg md:text-xl truncate mb-2 text-gray-900">
              {AWARD_ITEM.title}
            </h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {AWARD_ITEM.description}
            </p>

            {/* Stats & Actions */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">{AWARD_ITEM.stats.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{AWARD_ITEM.stats.comments}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Share2 className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                <Bookmark className="w-4 h-4 fill-current text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
