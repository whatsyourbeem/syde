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
    <NavigationMenu className="w-full md:h-auto flex justify-start md:justify-center items-center text-base font-semibold overflow-x-auto no-scrollbar">
      <NavigationMenuList className="h-full flex-nowrap gap-0">
        <NavigationMenuItem className="flex-shrink-0">
          <NavigationMenuLink asChild>
            <Link
              href="/log"
              className={cn(
                "text-center py-2 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 !rounded-none h-full flex items-center flex-shrink-0 whitespace-nowrap",
                pathname.startsWith("/log")
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
              href="/showcase"
              className={cn(
                "text-center py-2 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 !rounded-none h-full flex items-center flex-shrink-0 whitespace-nowrap",
                pathname.startsWith("/showcase")
                  ? "font-bold text-primary border-b-2 border-primary"
                  : "text-gray-400"
              )}
            >
              쇼케이스
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="flex-shrink-0">
          <NavigationMenuLink asChild>
            <Link
              href="/insight"
              className={cn(
                "text-center py-2 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 !rounded-none h-full flex items-center flex-shrink-0 whitespace-nowrap",
                pathname.startsWith("/insight")
                  ? "font-bold text-primary border-b-2 border-primary"
                  : "text-gray-400"
              )}
            >
              인사이트
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="flex-shrink-0">
          <NavigationMenuLink asChild>
            <Link
              href="/meetup"
              className={cn(
                "text-center py-2 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 !rounded-none h-full flex items-center flex-shrink-0 whitespace-nowrap",
                pathname.startsWith("/meetup")
                  ? "font-bold text-primary border-b-2 border-primary"
                  : "text-gray-400"
              )}
            >
              모임
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="flex-shrink-0">
          <NavigationMenuLink asChild>
            <Link
              href="/club"
              className={cn(
                "text-center py-2 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 !rounded-none h-full flex items-center flex-shrink-0 whitespace-nowrap",
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
