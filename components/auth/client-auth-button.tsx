"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { UserRound, User, Settings, BookmarkCheck, LogOut } from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/app/auth/auth-actions";
import { createClient } from "@/lib/supabase/client";

interface ClientAuthButtonProps {
  sheetHeader?: boolean;
}

export function ClientAuthButton({ sheetHeader }: ClientAuthButtonProps) {
  const { openLoginDialog } = useLoginDialog();
  const { user, profile, avatarUrl, isLoading } = useAuth();
  const username = profile?.username ?? null;
  const fullName = profile?.full_name ?? username;
  const profileLink = username ? `/@${username}` : "/profile";

  const handleLogout = async () => {
    // Fire SIGNED_OUT locally first so AuthContext updates immediately — logout()
    // below redirects server-side, which is a client-side navigation with no
    // reload, so onAuthStateChange would otherwise never see the session change.
    const supabase = createClient();
    await supabase.auth.signOut();
    await logout();
  };

  // While the client session resolves, show the same "no avatar yet" placeholder
  // used below instead of flashing the logged-out login button at a logged-in visitor.
  if (isLoading) {
    return <div className="w-9 h-9 bg-gray-200 rounded-full m-0.5" />;
  }

  return (
    <>
      {sheetHeader ? (
        // Mobile Sheet Mode
        <>
          {user ? (
            // Logged-in mobile sheet: profile image + nickname
            <SheetClose asChild>
              <Link href={profileLink} className="justify-start w-full">
                <Button
                  variant="ghost"
                  className="justify-start p-2 h-auto w-full"
                >
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
                    <div className="flex flex-col overflow-hidden min-w-0 max-w-[150px] text-left">
                      <span className="text-sm font-semibold truncate">
                        {fullName || username}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        @{username || user.email}
                      </span>
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
            // Logged-in desktop: avatar opens a dropdown menu
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex-none m-0.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href={profileLink} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    마이페이지
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    프로필 관리
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/activity" className="cursor-pointer">
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                    내 기록
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
