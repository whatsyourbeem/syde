export default function MeetupCreateLoading() {
  return (
    <div className="max-w-3xl mx-auto p-4 animate-pulse">
      <div className="h-8 bg-muted rounded-md w-1/2 mb-6"></div>

      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-24"></div>
          <div className="h-10 bg-muted rounded-md w-full"></div>
        </div>
        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-32"></div>
          <div className="h-40 bg-muted rounded-md w-full"></div>
        </div>
        {/* Thumbnail */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-32"></div>
          <div className="flex items-center gap-4">
            <div className="w-48 h-32 bg-muted rounded-md"></div>
            <div className="h-10 w-24 bg-muted rounded-md"></div>
          </div>
        </div>
        {/* Datetime */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-10 bg-muted rounded-md w-full"></div>
          <div className="h-10 bg-muted rounded-md w-full"></div>
        </div>
        {/* Status */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-16"></div>
          <div className="h-10 bg-muted rounded-md w-full"></div>
        </div>
        {/* Location Description */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-32"></div>
          <div className="h-10 bg-muted rounded-md w-full"></div>
        </div>
        {/* Max Participants */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-40"></div>
          <div className="h-10 bg-muted rounded-md w-full"></div>
        </div>
        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <div className="h-10 w-24 bg-muted rounded-md"></div>
          <div className="h-10 w-24 bg-muted rounded-md"></div>
        </div>
      </div>
    </div>
  );
}
