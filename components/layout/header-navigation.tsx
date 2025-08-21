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
              HOME
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              "flex-1 text-center py-2 px-4 hover:text-primary hover:font-bold md:flex-none md:text-left md:py-4 rounded-none h-full flex items-center",
              pathname.startsWith("/gathering")
                ? "font-bold text-primary border-b-2 border-primary"
                : "text-gray-400"
            )}
          >
            GATHERING
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/gathering"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">
                      Gathering
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Meetups and Clubs for your community.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem href="/gathering/meetup" title="Meetup">
                Find and join meetups.
              </ListItem>
              <ListItem href="/gathering/club" title="Club">
                Discover and create clubs.
              </ListItem>
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
