import Link from "next/link";
import Image from "next/image";
import { BannerSection } from "./banner-section";
import { AwardSection } from "./award-section";

export function ShowcaseRightSidebar() {
  return (
    <div className="hidden lg:block w-1/5 sticky top-[70px] self-start h-screen p-4 overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-6">
        {/* Banner Section */}
        <BannerSection />

        {/* Award Section */}
        <AwardSection />

        {/* Footer Links */}
        <div className="flex flex-col items-center text-center mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-4">ⓒ 2025. SYDE</p>
          <div className="flex justify-center gap-4">
            <Link
              href="https://open.kakao.com/o/gduSGmtf"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <Image
                src="/kakao-talk-bw.png"
                alt="Kakao"
                width={20}
                height={20}
              />
            </Link>
            <Link
              href="https://www.instagram.com/syde.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <Image
                src="/instagram.png"
                alt="Instagram"
                width={20}
                height={20}
              />
            </Link>
            <Link
              href="https://www.threads.com/@syde.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <Image src="/threads.png" alt="Threads" width={20} height={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
