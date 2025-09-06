export default function SearchLoading() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center p-5 animate-pulse">
      <div className="w-full max-w-2xl mx-auto mb-8">
        {/* SearchForm Skeleton */}
        <div className="h-10 bg-muted rounded-md w-full"></div>
      </div>

      <div className="w-full max-w-2xl">
        {/* Tabs Skeleton */}
        <div className="grid w-full grid-cols-2">
          <div className="h-10 bg-muted rounded-t-md"></div>
          <div className="h-10 bg-muted rounded-t-md"></div>
        </div>
        {/* Tab Content Skeleton */}
        <div className="mt-4 space-y-4">
            {/* This could be a skeleton for either LogList or UserList */}
            <div className="rounded-lg bg-card p-6">
                <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                </div>
            </div>
            <div className="rounded-lg bg-card p-6">
                <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                </div>
            </div>
            <div className="rounded-lg bg-card p-6">
                <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
