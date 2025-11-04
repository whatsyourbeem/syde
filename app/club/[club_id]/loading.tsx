export default function ClubDetailLoading() {
  return (
    <div className="p-4 animate-pulse">
      <div className="space-y-6">
        {/* Club Description Skeleton */}
        <div className="p-4 bg-card rounded-lg">
          <div className="h-6 bg-muted rounded-md w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md w-full"></div>
            <div className="h-4 bg-muted rounded-md w-full"></div>
            <div className="h-4 bg-muted rounded-md w-3/4"></div>
          </div>
        </div>
        {/* Meetups Skeleton */}
        <div>
          <div className="h-6 bg-muted rounded-md w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
          </div>
        </div>
        {/* Forum Posts Skeleton */}
        <div>
          <div className="h-6 bg-muted rounded-md w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-24 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}