import Link from "next/link";
import Image from "next/image";
import { BannerSection } from "./banner-section";
import { AwardSection } from "./award-section";

export function ShowcaseRightSidebar() {
  return (
    <div className="hidden lg:block w-1/5 sticky top-[70px] self-start h-screen p-4 overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-6">
        {/* Banner Section */}
        {/* <BannerSection /> */}

        {/* Award Section */}
        {/* <AwardSection /> */}
      </div>
    </div>
  );
}
