"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNavigation() {
  const pathname = usePathname();

  return (
    <div className="w-full max-w-5xl flex justify-start items-center px-5 text-sm font-semibold gap-12">
      <Link
        href="/"
        className={`text-base py-3 mb-[-2px] ${
          pathname === "/"
            ? "border-b-2 border-primary font-bold text-primary"
            : "border-b-2 border-transparent text-gray-400"
        }`}
      >
        Home
      </Link>
      <Link
        href="/gathering"
        className={`text-base py-3 mb-[-2px] ${
          pathname.startsWith("/gathering")
            ? "border-b-2 border-primary font-bold text-primary"
            : "border-b-2 border-transparent text-gray-400"
        }`}
      >
        Gathering
      </Link>
    </div>
  );
}
