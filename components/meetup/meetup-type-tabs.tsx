"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MeetupTypeTabsProps {
  className?: string;
}

export default function MeetupTypeTabs({ className }: MeetupTypeTabsProps) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const [currentActiveTab, setCurrentActiveTab] = useState(searchParams.get("type") || "전체");

  useEffect(() => {
    setCurrentActiveTab(searchParams.get("type") || "전체");
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setCurrentActiveTab(value);
    const params = new URLSearchParams(searchParams);
    if (value === "전체") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs
      value={currentActiveTab}
      className={cn("mx-auto max-w-fit", className)}
      onValueChange={handleTabChange}
    >
      <TabsList className="flex justify-center items-center gap-1">
        <TabsTrigger
          value="전체"
          className={cn(
            "px-4 py-2",
            currentActiveTab === "전체" && "bg-sydenightblue text-white"
          )}
        >
          전체
        </TabsTrigger>
        <TabsTrigger
          value="정기모임"
          className={cn(
            "px-4 py-2",
            currentActiveTab === "정기모임" && "bg-sydenightblue text-white"
          )}
        >
          정기모임
        </TabsTrigger>
        <TabsTrigger
          value="스핀오프"
          className={cn(
            "px-4 py-2",
            currentActiveTab === "스핀오프" && "bg-sydenightblue text-white"
          )}
        >
          스핀오프
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
