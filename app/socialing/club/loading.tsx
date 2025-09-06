export default function ClubPageLoading() {
  return (
    <div className="w-full p-4">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg overflow-hidden w-full flex items-start gap-4 px-4 py-6"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 animate-pulse rounded-md flex-shrink-0" />
            <div className="flex-grow flex flex-col justify-between self-stretch">
              <div>
                <div className="h-5 bg-gray-200 animate-pulse rounded-md mb-2" />
                <div className="h-4 bg-gray-200 animate-pulse rounded-md w-2/3" />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 py-2">
                <div className="flex items-center gap-2">
                  <div className="size-6 bg-gray-200 animate-pulse rounded-full" />
                  <div className="h-4 bg-gray-200 animate-pulse rounded-md w-20" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div
                        key={j}
                        className="size-7 bg-gray-200 animate-pulse rounded-full border-2 border-white"
                      />
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 animate-pulse rounded-md w-8 ml-1" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
