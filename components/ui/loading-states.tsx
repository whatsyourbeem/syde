import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
}

interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn("rounded-lg bg-card p-6 animate-pulse", className)}>
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-muted rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-20 bg-muted rounded" />
        <div className="flex space-x-4 mt-4">
          <div className="h-8 w-16 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

interface LoadingListProps {
  count?: number;
  className?: string;
}

export function LoadingList({ count = 3, className }: LoadingListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

interface CenteredLoadingProps {
  message?: string;
  className?: string;
}

export function CenteredLoading({ 
  message = "Loading...", 
  className 
}: CenteredLoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-muted-foreground text-sm">{message}</p>
    </div>
  );
}