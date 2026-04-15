import { Suspense } from "react";
import { LogSidebarServer, LogSidebarSkeleton } from "@/components/log/log-sidebar-server";
import { TrendingShowcases } from "@/components/showcase/trending-showcases";
import Image from "next/image";
import Link from "next/link";
import { Banner } from "@/components/common/banner";
import { BANNER_POSITIONS } from "@/lib/constants";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그 | SYDE - 사이드프로젝트 커뮤니티 플랫폼",
  description: "사이드프로젝트 실시간 트렌드 및 인사이트 - SYDE 커뮤니티에 실시간으로 업데이트되는 새로운 쇼케이스, 오프라인 모임 소식, 그리고 메이커들의 생생한 인사이트를 가장 먼저 확인해 보세요.",
  alternates: {
    canonical: "/log",
  },
};

export default function LogLayout({ children }: { children: React.ReactNode }) {

  return (
    <main className="flex justify-center gap-x-5 pb-3 md:px-5 md:pb-5 max-w-6xl mx-auto">
      <div className="hidden md:block w-1/5 sticky top-[70px] self-start h-screen">
        <Suspense fallback={<LogSidebarSkeleton />}>
          <LogSidebarServer />
        </Suspense>
      </div>
      <div className="w-full md:w-4/5 lg:w-3/5 border-x border-gray-200">
        {children}
      </div>
      <div className="hidden lg:block w-1/5 sticky top-[70px] self-start h-screen py-4 px-0 space-y-8">
        <TrendingShowcases />
        <Banner position={BANNER_POSITIONS.LOG_SIDEBAR} />
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
    </main>
  );
}
