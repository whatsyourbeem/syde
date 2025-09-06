export default function StaticPageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 bg-muted rounded-md w-1/3 mb-4 animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded-md w-full animate-pulse"></div>
        <div className="h-4 bg-muted rounded-md w-full animate-pulse"></div>
        <div className="h-4 bg-muted rounded-md w-3/4 animate-pulse"></div>
        <div className="h-4 bg-muted rounded-md w-1/2 animate-pulse"></div>
      </div>
    </div>
  );
}
