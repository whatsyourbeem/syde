"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { SheetClose } from "@/components/ui/sheet";
import { useLoginDialog } from "@/context/LoginDialogContext";

interface ClientAuthButtonProps {
  user: User | null; // Supabase user object
  avatarUrl: string | null;
  username: string | null;
  sheetHeader?: boolean;
}

export function ClientAuthButton({
  user,
  avatarUrl,
  username,
  sheetHeader,
}: ClientAuthButtonProps) {
  const { openLoginDialog } = useLoginDialog();
  const profileLink = username ? `/${username}` : "/profile";

  return (
    <>
      {sheetHeader ? (
        // Mobile Sheet Mode
        <>
          {user ? (
            // Logged-in mobile sheet: profile image + nickname
            <SheetClose asChild>
              <Link href={profileLink} className="justify-start w-full">
                <Button variant="ghost" className="justify-start p-2 h-auto w-full">
                  <div className="flex items-center gap-2">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="User Avatar"
                        width={36}
                        height={36}
                        className="rounded-full object-cover aspect-square"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-gray-200 rounded-full" />
                    )}
                    <div className="flex flex-col items-start">
                      <span className="text-base font-normal">{username || user.email}</span>
                    </div>
                  </div>
                </Button>
              </Link>
            </SheetClose>
          ) : (
            // Logged-out mobile sheet: Login Button
            <SheetClose asChild>
              <Button
                onClick={openLoginDialog}
                variant="ghost"
                className="justify-start p-2 h-auto w-full"
              >
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5" />
                  <span className="text-base font-normal">
                    로그인 / 회원가입
                  </span>
                </div>
              </Button>
            </SheetClose>
          )}
        </>
      ) : (
        // Desktop Mode (sheetHeader is false)
        <>
          {user ? (
            // Logged-in desktop: profile image only
            <Link href={profileLink} className="flex-none m-0.5">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="User Avatar"
                  width={36}
                  height={36}
                  className="rounded-full object-cover aspect-square"
                />
              ) : (
                <div className="w-9 h-9 bg-gray-200 rounded-full" />
              )}
            </Link>
          ) : (
            // Logged-out desktop: Login Button
            <Button
              onClick={openLoginDialog}
              variant="ghost"
              className="relative rounded-full m-0.5 h-9 w-9"
            >
              <UserRound className="h-5 w-5" />
            </Button>
          )}
        </>
      )}
    </>
  );
}
