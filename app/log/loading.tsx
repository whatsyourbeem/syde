export default function LogPageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-card flex flex-col p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start">
                <div className="w-9 h-9 bg-gray-200 animate-pulse rounded-full mr-3" />
                <div className="flex-grow">
                  <div className="h-4 bg-gray-200 animate-pulse rounded-md w-32 mb-1" />
                  <div className="h-3 bg-gray-200 animate-pulse rounded-md w-20" />
                </div>
              </div>
            </div>
            
            <div className="pl-12 space-y-3">
              <div className="h-4 bg-gray-200 animate-pulse rounded-md w-full" />
              <div className="h-4 bg-gray-200 animate-pulse rounded-md w-3/4" />
              <div className="h-32 bg-gray-200 animate-pulse rounded-md w-full" />
            </div>
            
            <div className="flex items-center justify-between pt-4 pl-12">
              <div className="flex items-center gap-4">
                <div className="h-8 bg-gray-200 animate-pulse rounded-md w-16" />
                <div className="h-8 bg-gray-200 animate-pulse rounded-md w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}