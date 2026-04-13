export default function ShowcasePageLoading() {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Mobile: TrendingShowcases skeleton (collapsed = 1 item) */}
      <div className="lg:hidden flex flex-col gap-0">
        <div className="pt-4 pb-2 px-4 border-b border-gray-200">
          <div className="h-[14px] bg-gray-200 animate-pulse rounded w-32 mb-2" />
          <div className="flex items-center gap-2">
            <div className="w-[14px] h-[20px] bg-gray-200 animate-pulse rounded" />
            <div className="w-[40px] h-[40px] bg-gray-200 animate-pulse rounded-lg shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-[14px] bg-gray-200 animate-pulse rounded w-3/4" />
              <div className="h-[12px] bg-gray-200 animate-pulse rounded w-1/2" />
            </div>
          </div>
        </div>
        <div className="w-full px-4 pt-3 pb-1">
          <div className="w-full h-[44px] bg-gray-200 animate-pulse rounded-[12px]" />
        </div>
      </div>

      {/* Showcase list skeleton — must match ShowcaseList isLoading state exactly */}
      <div className="w-full">
        <div className="flex flex-col">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-full border-b border-gray-200 last:border-0 py-6 px-3"
            >
              <div className="flex gap-3 md:gap-4 animate-pulse">
                <div className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] bg-gray-200 rounded-[10px] shrink-0" />
                <div className="flex flex-col justify-between md:h-[120px] flex-1 gap-1 md:gap-0">
                  <div className="flex flex-col gap-1 md:gap-2">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-5 bg-gray-200 rounded w-2/5" />
                  </div>
                  <div className="hidden md:block h-[28px] bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="md:hidden mt-2 h-[28px] bg-gray-200 animate-pulse rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
