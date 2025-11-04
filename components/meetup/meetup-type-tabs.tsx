"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface MeetupTypeTabsProps {
  className?: string;
}

export default function MeetupTypeTabs({ className }: MeetupTypeTabsProps) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get("type") || "전체";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "전체") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs defaultValue={activeTab} className={cn("mx-auto max-w-fit", className)} onValueChange={handleTabChange}>
      <TabsList className="flex justify-center items-center gap-1">
        <TabsTrigger value="전체" className="px-4 py-2">
          전체
        </TabsTrigger>
        <TabsTrigger value="정기모임" className="px-4 py-2">
          정기모임
        </TabsTrigger>
        <TabsTrigger value="스핀오프" className="px-4 py-2">
          스핀오프
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
