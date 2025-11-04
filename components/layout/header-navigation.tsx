"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export function HeaderNavigation() {
  const pathname = usePathname();

  return (
    <NavigationMenu className="w-full md:h-auto flex-grow flex justify-center items-center text-base font-semibold">
      <NavigationMenuList className="h-full">
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/"
              className={cn(
                "flex-1 text-center py-2 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 !rounded-none h-full flex items-center",
                pathname === "/" || pathname.startsWith("/log")
                  ? "font-bold text-primary border-b-2 border-primary"
                  : "text-gray-400"
              )}
            >
              로그
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/meetup"
              className={cn(
                "flex-1 text-center py-2 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 !rounded-none h-full flex items-center",
                pathname.startsWith("/meetup")
                  ? "font-bold text-primary border-b-2 border-primary"
                  : "text-gray-400"
              )}
            >
              모임
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/club"
              className={cn(
                "flex-1 text-center py-2 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 !rounded-none h-full flex items-center",
                pathname.startsWith("/club")
                  ? "font-bold text-primary border-b-2 border-primary"
                  : "text-gray-400"
              )}
            >
              클럽
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
