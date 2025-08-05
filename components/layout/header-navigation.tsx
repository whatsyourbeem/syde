"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNavigation() {
  const pathname = usePathname();

  return (
    <div className="flex-grow flex justify-center items-center text-sm font-semibold gap-12">
      <Link
        href="/"
        className={`text-sm py-3 mb-[-2px] ${
          pathname === "/" || pathname.startsWith("/log")
            ? "font-bold text-primary"
            : "text-gray-400"
        }`}
      >
        Home
      </Link>
      <Link
        href="/gathering"
        className={`text-sm py-3 mb-[-2px] ${
          pathname.startsWith("/gathering")
            ? "font-bold text-primary"
            : "text-gray-400"
        }`}
      >
        Gathering
      </Link>
    </div>
  );
}
