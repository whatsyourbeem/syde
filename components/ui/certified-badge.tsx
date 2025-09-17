import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CertifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CertifiedBadge({
  className,
  size = "md",
}: CertifiedBadgeProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <BadgeCheck
      fill="#4193EF"
      className={cn("text-white flex-shrink-0", sizeClasses[size], className)}
    />
  );
}
