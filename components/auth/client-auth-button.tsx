"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useLoginModal } from "@/context/LoginModalContext"; // Import useLoginModal

import { UserRound } from "lucide-react";

import { User } from "@supabase/supabase-js";

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
  const { openLoginModal } = useLoginModal(); // Use the hook

  const profileLink = username ? `/${username}` : "/profile";

  return (
    <>
      {sheetHeader ? (
        // Mobile Sheet Mode
        <>
          {user ? (
            // Logged-in mobile sheet: profile image + nickname
            <Link href={profileLink} className="justify-start p-2">
              <Button variant="ghost" className="justify-start p-2 h-auto">
                <div className="flex items-center gap-2">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="User Avatar"
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
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
          ) : (
            // Logged-out mobile sheet: UserRound icon + "로그인/회원가입" text
            <div onClick={openLoginModal} className="flex items-center gap-2 justify-start p-2 h-9 w-auto text-base font-normal">
              <UserRound className="h-5 w-5 !size-5" />
              <span className="!text-base !font-normal !text-foreground !block">
                로그인 / 회원가입
              </span>
            </div>
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
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 bg-gray-200 rounded-full" />
              )}
            </Link>
          ) : (
            // Logged-out desktop: UserRound icon only
            <Button variant="ghost" onClick={openLoginModal} className="relative rounded-full m-0.5 h-9 w-9">
              <UserRound className="h-5 w-5 !size-5" />
            </Button>
          )}
        </>
      )}
    </>
  );
}