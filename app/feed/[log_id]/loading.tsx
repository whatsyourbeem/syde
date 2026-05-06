export default function LogDetailLoading() {
  return (
    <div className="px-4 pb-4 mb-4 bg-card flex flex-col animate-pulse">
      {/* Back Button Bar */}
      <div className="flex items-center mb-2 mt-2">
        <div className="h-10 w-10 bg-muted rounded-full"></div>
      </div>
      
      <div className="border-b border-border mb-4"></div>

      {/* Section 1: Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-muted rounded-full mr-3"></div>
          <div className="flex-grow space-y-1">
            <div className="h-4 bg-muted rounded-md w-32"></div>
            <div className="h-3 bg-muted rounded-md w-20"></div>
          </div>
        </div>
        <div className="h-6 w-6 bg-muted rounded-md"></div>
      </div>

      {/* Log Content */}
      <div className="py-1 pl-11 mt-4 space-y-3">
        <div className="h-4 bg-muted rounded-md w-full"></div>
        <div className="h-4 bg-muted rounded-md w-full"></div>
        <div className="h-4 bg-muted rounded-md w-3/4"></div>
        <div className="h-40 bg-muted rounded-lg w-full mt-4"></div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center px-[52px] pt-4">
        <div className="flex items-center gap-4">
            <div className="h-8 w-16 bg-muted rounded-md"></div>
            <div className="h-8 w-16 bg-muted rounded-md"></div>
        </div>
        <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-muted rounded-md"></div>
            <div className="h-8 w-8 bg-muted rounded-md"></div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-4 border-t pt-4">
        {/* Comment Form Skeleton */}
        <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="flex-1">
                <div className="h-10 bg-muted rounded-md w-full"></div>
                <div className="h-8 w-20 bg-muted rounded-md mt-2"></div>
            </div>
        </div>
        {/* Comment List Skeleton */}
        <div className="space-y-4 mt-4">
            <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
            </div>
            <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
