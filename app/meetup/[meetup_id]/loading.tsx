export default function MeetupDetailLoading() {
  return (
    <div className="p-4 animate-pulse">
      <div className="space-y-6">
        {/* Meetup Header Skeleton */}
        <div className="p-4 bg-card rounded-lg">
          <div className="h-8 bg-muted rounded-md w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded-md w-1/2 mb-4"></div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="h-4 bg-muted rounded-md w-1/4"></div>
          </div>
        </div>
        {/* Meetup Description Skeleton */}
        <div className="p-4 bg-card rounded-lg">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md w-full"></div>
            <div className="h-4 bg-muted rounded-md w-full"></div>
            <div className="h-4 bg-muted rounded-md w-full"></div>
            <div className="h-4 bg-muted rounded-md w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}