/**
 * 프로필 페이지(page.tsx)와 같은 래퍼·여백·크기를 쓰는 스켈레톤.
 * 레이아웃을 바꾸면 이 파일도 함께 맞춰야 로딩 → 실제 화면 전환 때 튀지 않는다.
 */
function Bar({ className }: { className: string }) {
  return <div className={`bg-muted rounded-md animate-pulse ${className}`} />;
}

export default function UserProfileLoading() {
  return (
    <div className="flex-1 w-full flex flex-col h-full" aria-busy="true">
      <div className="w-full max-w-[850px] mx-auto flex-1 flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col">
          {/* ProfileIdentityHeader */}
          <div className="flex flex-col md:flex-row items-center gap-5 px-5 py-8 md:px-8 md:py-6">
            <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-full bg-muted animate-pulse" />
            <div className="flex-grow min-w-0 flex flex-col items-center md:items-start gap-2">
              <Bar className="h-8 w-44" />
              <Bar className="h-5 w-56 max-w-full" />
            </div>
          </div>

          {/* ProfileSocialLinks */}
          <div className="flex items-center gap-1 px-5 py-2 md:px-8 -ml-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-11 h-11 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
              </div>
            ))}
          </div>

          {/* ProfileEvidenceBar */}
          <div className="grid grid-cols-4 gap-1.5 md:gap-3 mx-5 md:mx-8 mt-4 mb-2 px-2 py-4 md:p-5 bg-[#FAFAFA] rounded-xl">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Bar className="h-6 md:h-[26px] w-9" />
                <Bar className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* ProfileTabs */}
        <div className="flex items-center gap-1 mx-5 md:mx-8 border-b border-[#EEEEEE]">
          {[0, 1].map((i) => (
            <div key={i} className="min-w-[88px] px-5 py-3 flex justify-center border-b-2 border-transparent">
              <Bar className="h-5 w-10" />
            </div>
          ))}
        </div>

        {/* 소개 탭: 소개 / 대표 프로젝트 */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="px-5 py-4 md:px-8 md:py-6">
            <Bar className="h-6 w-16 mb-2" />
            <div className="rounded-xl bg-[#FAFAFA] p-5 flex flex-col gap-3">
              <Bar className="h-4 w-1/2" />
              <Bar className="h-4 w-full" />
              <Bar className="h-4 w-5/6" />
            </div>
          </div>
          <div className="px-5 py-4 md:px-8 md:py-6">
            <Bar className="h-6 w-24 mb-2" />
            <div className="bg-[#FAFAFA] rounded-xl h-[81px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
