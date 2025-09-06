export default function UserProfileLoading() {
  return (
    <div className="flex-1 w-full flex flex-col p-5 h-full">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        {/* Profile Header Skeleton */}
        <div className="flex flex-row-reverse items-center gap-6 p-6 rounded-lg bg-card mb-8">
          <div className="relative w-24 h-24 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-muted animate-pulse" />
          </div>
          <div className="flex-grow space-y-2">
            <div className="h-7 bg-muted rounded-md w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded-md w-32 animate-pulse" />
            <div className="h-4 bg-muted rounded-md w-64 animate-pulse" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="w-full md:flex-row md:gap-8 h-full flex">
            {/* Left Sidebar Skeleton */}
            <div className="w-full md:w-1/4 md:border-r border-b md:border-b-0 md:pr-8">
                <div className="flex w-full justify-center p-1 rounded-lg space-x-2 md:flex-col md:items-stretch md:justify-start bg-transparent md:p-0 md:rounded-none md:space-y-1 md:space-x-0">
                    <div className="h-9 bg-muted rounded-md w-full animate-pulse mb-1" />
                    <div className="h-9 bg-muted rounded-md w-full animate-pulse mb-1" />
                    <div className="h-9 bg-muted rounded-md w-full animate-pulse" />
                </div>
            </div>
            {/* Right Content Skeleton */}
            <div className="w-full md:w-3/4 md:pl-8 mt-4 md:mt-0">
                <div className="space-y-4">
                    <div className="h-20 bg-muted rounded-md w-full animate-pulse" />
                    <div className="h-20 bg-muted rounded-md w-full animate-pulse" />
                    <div className="h-20 bg-muted rounded-md w-full animate-pulse" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
