"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNavigation() {
  const pathname = usePathname();

  return (
    <div className="w-full flex-grow flex justify-center items-center text-xs md:text-base font-semibold">
      <Link
        href="/"
        className={`flex-1 text-center py-1 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 ${
          pathname === "/" || pathname.startsWith("/log")
            ? "font-bold text-primary border-b-2 border-primary"
            : "text-gray-400"
        }`}
      >
        HOME
      </Link>
      <Link
        href="/gathering"
        className={`flex-1 text-center py-1 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 ${
          pathname.startsWith("/gathering")
            ? "font-bold text-primary border-b-2 border-primary"
            : "text-gray-400"
        }`}
      >
        GATHERING
      </Link>
    </div>
  );
}
