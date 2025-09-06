export default function ProfileLoading() {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-5 animate-pulse">
      <div className="w-full max-w-2xl">
        <div className="h-8 bg-muted rounded-md w-1/3 mb-4"></div>
        <div className="h-4 bg-muted rounded-md w-2/3 mb-4"></div>
        <div className="border-b py-2 mb-4"></div>
        
        <div className="space-y-8 pt-4">
          {/* Full Name */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md w-16"></div>
            <div className="h-10 bg-muted rounded-md w-full"></div>
          </div>
          {/* Username */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md w-24"></div>
            <div className="h-10 bg-muted rounded-md w-full"></div>
            <div className="h-3 bg-muted rounded-md w-2/3"></div>
          </div>
          {/* Avatar */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-muted rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded-md w-20"></div>
                <div className="h-10 w-24 bg-muted rounded-md"></div>
              </div>
            </div>
          </div>
          {/* Tagline */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md w-20"></div>
            <div className="h-10 bg-muted rounded-md w-full"></div>
          </div>
          {/* Link */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md w-12"></div>
            <div className="h-10 bg-muted rounded-md w-full"></div>
          </div>
          {/* Buttons */}
          <div className="pt-4 flex space-x-2">
            <div className="h-10 w-24 bg-muted rounded-md"></div>
            <div className="h-10 w-24 bg-muted rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
