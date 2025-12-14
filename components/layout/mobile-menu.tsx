"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/auth-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";

interface MobileMenuProps {
  user: User | null;
  authButton: React.ReactNode;
}

export function MobileMenu({ user, authButton }: MobileMenuProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="md:hidden rounded-full">
        <Menu />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden rounded-full">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[250px] sm:w-[300px] flex flex-col gap-1 py-2 pr-10"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
        </SheetHeader>
        <div className="flex-grow flex flex-col gap-1">
          <div className="flex items-center gap-2 pb-2 border-b w-full">
            {authButton}
          </div>
          <SheetClose asChild>
            <Link
              href="/"
              className={`mt-2 p-2 hover:bg-secondary rounded-md transition-all ${
                pathname === "/" || pathname.startsWith("/log")
                  ? "font-bold text-primary"
                  : ""
              }`}
            >
              로그
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/meetup"
              className={`p-2 hover:bg-secondary rounded-md transition-all ${
                pathname.startsWith("/meetup") ? "font-bold text-primary" : ""
              }`}
            >
              모임
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/club"
              className={`p-2 hover:bg-secondary rounded-md transition-all ${
                pathname.startsWith("/club") ? "font-bold text-primary" : ""
              }`}
            >
              클럽
            </Link>
          </SheetClose>
        </div>
        {user && (
          <div className="py-2 px-0 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>로그아웃 하시겠습니까?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <form action={logout}>
                    <AlertDialogAction asChild>
                      <Button className="w-full" type="submit">
                        로그아웃
                      </Button>
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        <div className="py-2 px-0 border-t">
          <Link
            href="https://open.kakao.com/o/gduSGmtf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:bg-secondary p-2 rounded-md text-xs"
          >
            <Image
              src="/kakao-talk-bw.png"
              alt="Kakao"
              width={20}
              height={20}
            />
            <span>SYDE 오픈채팅</span>
          </Link>
          <Link
            href="https://www.instagram.com/syde.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:bg-secondary p-2 rounded-md text-xs"
          >
            <Image
              src="/instagram.png"
              alt="Instagram"
              width={20}
              height={20}
            />
            <span>Instagram</span>
          </Link>
          <Link
            href="https://www.threads.net/@syde.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:bg-secondary p-2 rounded-md text-xs"
          >
            <Image src="/threads.png" alt="Threads" width={20} height={20} />
            <span>Threads</span>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
