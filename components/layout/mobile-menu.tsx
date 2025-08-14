"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";

interface MobileMenuProps {
  user: User | null;
  notificationBell: React.ReactNode;
  authButton: React.ReactNode;
}

export function MobileMenu({ user, notificationBell, authButton }: MobileMenuProps) {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[250px] sm:w-[300px] flex flex-col">
        <div className="flex-grow flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2 pb-4 border-b">
            {authButton}
          </div>
          <Link href="/" className={`${pathname === "/" ? "font-bold text-primary" : ""}`}>HOME</Link>
          <Link href="/gathering" className={`${pathname.startsWith("/gathering") ? "font-bold text-primary" : ""}`}>GATHERING</Link>
          <Link
            href="https://open.kakao.com/o/gduSGmtf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:bg-[#FEE500]/20 p-2 rounded-md"
          >
            <Image
              src="/kakao-talk.png"
              alt="Kakao"
              width={24}
              height={24}
            />
            <span>SYDE 오픈채팅</span>
          </Link>
          <div className="flex items-center gap-4 pt-4 border-t">
            {notificationBell}
          </div>
        </div>
        {user && (
            <div className="p-4 border-t">
                <form action={logout}>
                    <Button type="submit" variant="ghost" className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                    </Button>
                </form>
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
}