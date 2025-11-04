export default function ClubCreateLoading() {
  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col items-center animate-pulse">
      <div className="h-8 bg-muted rounded-md w-1/2 mb-6"></div>
      
      <div className="w-full max-w-2xl space-y-6 p-4 bg-white rounded-lg shadow-md">
        {/* Club Name */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-24"></div>
          <div className="h-10 bg-muted rounded-md w-full"></div>
        </div>
        {/* Tagline */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-24"></div>
          <div className="h-10 bg-muted rounded-md w-full"></div>
        </div>
        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-24"></div>
          <div className="h-40 bg-muted rounded-md w-full"></div>
        </div>
        {/* Thumbnail */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-32"></div>
          <div className="h-64 bg-muted rounded-md w-full"></div>
          <div className="h-10 w-32 bg-muted rounded-md mx-auto"></div>
        </div>
        {/* Submit Button */}
        <div className="h-10 bg-muted rounded-md w-full"></div>
      </div>
    </div>
  );
}
