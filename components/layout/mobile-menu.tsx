"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";

interface MobileMenuProps {
  user: User | null;
  authButton: React.ReactNode;
}

export function MobileMenu({ user, authButton }: MobileMenuProps) {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[250px] sm:w-[300px] flex flex-col gap-1 py-2 pr-10">
        <SheetHeader>
          <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
        </SheetHeader>
        <div className="flex-grow flex flex-col gap-1">
          <div className="flex items-center gap-2 pb-2 border-b w-full">
            {authButton}
          </div>
          <SheetClose asChild>
            <Link href="/" className={`mt-2 p-2 ${pathname === "/" ? "font-bold text-primary" : ""}`}>HOME</Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/gathering" className={`p-2 ${pathname.startsWith("/gathering") ? "font-bold text-primary" : ""}`}>GATHERING</Link>
          </SheetClose>
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
        </div>
        {user && (
            <div className="py-2 px-0 border-t">
                <form action={logout}>
                    <SheetClose asChild>
                      <Button type="submit" variant="ghost" className="w-full justify-start">
                          <LogOut className="mr-2 h-4 w-4" />
                          로그아웃
                      </Button>
                    </SheetClose>
                </form>
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
}