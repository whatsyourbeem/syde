import Link from "next/link";
import Image from "next/image";
import { BannerSection } from "./banner-section";
import { AwardSection } from "./award-section";
import { TrendingShowcases } from "./trending-showcases";

export function ShowcaseRightSidebar() {
  return (
    <div className="hidden lg:block w-1/5 sticky top-[70px] self-start h-screen pt-6 overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-8">
        <TrendingShowcases />

        {/* Brand info */}
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-gray-500 mb-4">ⓒ {new Date().getFullYear()}. SYDE</p>
          <div className="flex justify-center gap-4">
            <Link
              href="https://open.kakao.com/o/gduSGmtf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              <Image
                src="/kakao-talk-bw.png"
                alt="Kakao"
                width={24}
                height={24}
              />
            </Link>
            <Link
              href="https://www.instagram.com/syde.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              <Image
                src="/instagram.png"
                alt="Instagram"
                width={24}
                height={24}
              />
            </Link>
            <Link
              href="https://www.threads.com/@syde.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              <Image
                src="/threads.png"
                alt="Threads"
                width={24}
                height={24}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
