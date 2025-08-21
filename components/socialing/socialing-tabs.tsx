"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SocialingTabs() {
  const pathname = usePathname();

  // activeTab을 결정하는 로직은 동일하게 유지
  const activeTab = pathname.split("/")[2] || "meetup";

  return (
    <div className="w-full h-8 md:h-auto flex-grow flex justify-center items-center text-base font-semibold">
      <Link
        href="/socialing/meetup"
        className={cn(
          "flex-1 text-center py-1 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4",
          activeTab === "meetup"
            ? "font-bold text-primary border-b-2 border-primary"
            : "text-gray-400"
        )}
      >
        Meetup
      </Link>
      <Link
        href="/socialing/club"
        className={cn(
          "flex-1 text-center py-1 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4",
          activeTab === "club"
            ? "font-bold text-primary border-b-2 border-primary"
            : "text-gray-400"
        )}
      >
        Club
      </Link>
    </div>
  );
}
