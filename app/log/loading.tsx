export default function LogPageLoading() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] justify-center gap-x-5 pb-3 md:px-5 md:pb-5">
      <div className="hidden md:block w-1/5 sticky top-[70px] self-start h-screen">
        <div className="w-full h-32 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
      <div className="w-full md:w-4/5 lg:w-3/5 border-x border-gray-200">
        <div className="w-full max-w-2xl mx-auto px-4 py-4">
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full" />
              <div className="h-4 bg-gray-200 animate-pulse rounded-md w-24" />
            </div>
            <div className="h-20 bg-gray-200 animate-pulse rounded-md w-full mb-3" />
            <div className="h-8 bg-gray-200 animate-pulse rounded-md w-16" />
          </div>
          
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-card flex flex-col p-6 min-h-[280px]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start">
                    <div className="w-9 h-9 bg-gray-200 animate-pulse rounded-full mr-3 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <div className="h-4 bg-gray-200 animate-pulse rounded-md w-32 mb-2" />
                      <div className="h-3 bg-gray-200 animate-pulse rounded-md w-20" />
                    </div>
                  </div>
                </div>
                
                <div className="pl-12 space-y-3 flex-grow">
                  <div className="h-4 bg-gray-200 animate-pulse rounded-md w-full" />
                  <div className="h-4 bg-gray-200 animate-pulse rounded-md w-3/4" />
                  <div className="h-32 bg-gray-200 animate-pulse rounded-md w-full" />
                </div>
                
                <div className="flex items-center justify-between pt-4 pl-12 mt-auto">
                  <div className="flex items-center gap-4">
                    <div className="h-8 bg-gray-200 animate-pulse rounded-md w-16" />
                    <div className="h-8 bg-gray-200 animate-pulse rounded-md w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center space-x-2 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-10 h-10 bg-gray-200 animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </div>
      <div className="hidden lg:block w-1/5 sticky top-[70px] self-start h-screen p-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-full h-16 bg-gray-200 animate-pulse rounded-md mb-4" />
          <div className="flex justify-center gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-6 h-6 bg-gray-200 animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}