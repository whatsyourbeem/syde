"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SHOWCASE_STATUSES,
  SHOWCASE_STATUS_DISPLAY_NAMES,
  type ShowcaseStatus,
} from "@/lib/constants";

const ALL_VALUE = "ALL";
const ALL_LABEL = "전체";

export function ShowcaseStatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || ALL_VALUE;

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === ALL_VALUE) {
      params.delete("status");
    } else {
      params.set("status", value);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  // SelectValue 는 항목이 마운트되기 전까지 라벨을 채우지 못하므로 직접 넘긴다.
  const currentLabel =
    currentStatus in SHOWCASE_STATUSES
      ? SHOWCASE_STATUS_DISPLAY_NAMES[currentStatus as ShowcaseStatus]
      : ALL_LABEL;

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-32 h-9 text-sm">
        <SelectValue placeholder={ALL_LABEL}>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{ALL_LABEL}</SelectItem>
        {Object.entries(SHOWCASE_STATUSES).map(([key, value]) => (
          <SelectItem key={key} value={value}>
            {SHOWCASE_STATUS_DISPLAY_NAMES[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
