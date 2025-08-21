
"use client";

import { usePathname } from "next/navigation";

export default function ClubRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isClubDetailPage = pathname.match(/\/socialing\/club\/[^/]+$/);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] justify-center gap-x-5 pb-3 md:pb-5">
      {!isClubDetailPage && (
        <div className="hidden md:block w-1/5 sticky top-[70px] self-start h-screen">
          {/* Generic Left Column Content */}
          <div className="p-4 rounded-lg shadow bg-white">
            <h3 className="font-bold mb-2">클럽 메뉴</h3>
            <p className="text-sm text-gray-600">여기에 클럽 관련 일반 메뉴가 표시됩니다.</p>
          </div>
        </div>
      )}
      <div className={`w-full md:w-4/5 lg:w-3/5 border-x border-gray-200 ${isClubDetailPage ? 'mx-auto' : ''}`}>
        {children}
      </div>
      {!isClubDetailPage && (
        <div className="hidden lg:block w-1/5 sticky top-[70px] self-start h-screen">
          {/* Generic Right Column Content */}
          <div className="p-4 rounded-lg shadow bg-white">
            <h3 className="font-bold mb-2">인기 클럽</h3>
            <p className="text-sm text-gray-600">여기에 인기 클럽 목록이 표시됩니다.</p>
          </div>
        </div>
      )}
    </main>
  );
}
