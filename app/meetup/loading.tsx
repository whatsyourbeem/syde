export default function SocialingLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-card p-4 animate-pulse">
            <div className="w-full h-32 bg-muted rounded-md mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/4 mt-2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
