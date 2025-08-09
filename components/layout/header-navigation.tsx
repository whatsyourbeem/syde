"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNavigation() {
  const pathname = usePathname();

  return (
    <div className="flex-grow flex justify-center items-center text-sm font-semibold gap-4">
      <Link
        href="/"
        className={`py-3 mb-[-2px] px-4 rounded-full hover:bg-secondary ${
          pathname === "/" || pathname.startsWith("/log")
            ? "font-bold text-primary"
            : "text-gray-400"
        }`}
      >
        HOME
      </Link>
      <Link
        href="/gathering"
        className={`py-3 mb-[-2px] px-4 rounded-full hover:bg-secondary ${
          pathname.startsWith("/gathering")
            ? "font-bold text-primary"
            : "text-gray-400"
        }`}
      >
        GATHERING
      </Link>
    </div>
  );
}
