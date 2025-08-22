"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SocialingTabs() {
  const pathname = usePathname();

  const activeTab = pathname.split("/")[2] || "meetup";

  return (
    <Tabs defaultValue={activeTab} className="mx-auto max-w-fit">
      <TabsList className="flex justify-center items-center gap-1">
        <TabsTrigger value="meetup" asChild>
          <Link href="/socialing/meetup" className="px-4 py-2">
            밋업
          </Link>
        </TabsTrigger>
        <TabsTrigger value="club" asChild>
          <Link href="/socialing/club" className="px-4 py-2">
            클럽
          </Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
