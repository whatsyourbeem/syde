import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  SHOWCASE_STATUSES,
  SHOWCASE_STATUS_DISPLAY_NAMES,
  type ShowcaseStatus,
} from "@/lib/constants";

interface ShowcaseStatusBadgeProps {
  status: ShowcaseStatus | null | undefined;
  className?: string;
}

function getStatusBadgeClass(status: ShowcaseStatus) {
  switch (status) {
    case SHOWCASE_STATUSES.DEVELOPING:
      return "bg-sydeorange text-white hover:bg-sydeorange hover:text-white";
    case SHOWCASE_STATUSES.IN_SERVICE:
      return "bg-green-700 text-white hover:bg-green-700 hover:text-green-50";
    case SHOWCASE_STATUSES.ENDED:
      return "bg-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-700";
    default:
      return "bg-gray-700 text-gray-50 hover:bg-gray-700 hover:text-gray-50";
  }
}

export function ShowcaseStatusBadge({
  status,
  className,
}: ShowcaseStatusBadgeProps) {
  if (!status) return null;

  return (
    <Badge
      className={cn(
        "shrink-0 rounded-full px-2 py-[2px] text-[11px] font-medium leading-none",
        getStatusBadgeClass(status),
        className,
      )}
    >
      {SHOWCASE_STATUS_DISPLAY_NAMES[status]}
    </Badge>
  );
}
