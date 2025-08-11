"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNavigation() {
  const pathname = usePathname();

  return (
    <div className="flex-grow flex justify-center items-center text-base font-semibold gap-4">
      <Link
        href="/"
        className={`py-4 px-4 hover:bg-secondary ${
          pathname === "/" || pathname.startsWith("/log")
            ? "font-bold text-primary border-b-2 border-primary"
            : "text-gray-400"
        }`}
      >
        HOME
      </Link>
      <Link
        href="/gathering"
        className={`py-4 px-4 hover:bg-secondary ${
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
