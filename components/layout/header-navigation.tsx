"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import React from "react";

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
          <NavigationMenuTrigger
            className={cn(
              "flex-1 text-center py-2 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 rounded-none h-full flex items-center [&>svg]:hidden",
              pathname.startsWith("/socialing")
                ? "font-bold text-primary border-b-2 border-primary"
                : "text-gray-400"
            )}
          >
            소셜링
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-0 p-0 w-[150px] md:w-[150px] lg:w-[200px] lg:grid-cols-[1fr]">
              <ListItem href="/socialing/meetup" title="밋업"></ListItem>
              <ListItem href="/socialing/club" title="클럽"></ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
