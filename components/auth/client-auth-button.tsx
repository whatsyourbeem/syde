"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useLoginModal } from "@/context/LoginModalContext"; // Import useLoginModal

import { UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { User } from "@supabase/supabase-js";

interface ClientAuthButtonProps {
  user: User | null; // Supabase user object
  avatarUrl: string | null;
  username: string | null;
}

export function ClientAuthButton({
  user,
  avatarUrl,
  username,
}: ClientAuthButtonProps) {
  const { openLoginModal } = useLoginModal(); // Use the hook

  const profileLink = username ? `/${username}` : "/profile";

  return (
    <>
      {user ? (
        <div className="flex items-center gap-4">
          <Link href={profileLink} className="flex-none m-0.5">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="hover:underline">Hey, {user.email}!</span>
            )}
          </Link>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative rounded-full m-0.5 h-9 w-9">
              <UserRound className="h-5 w-5 !size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={openLoginModal}>
              Sign in
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/auth/sign-up">Sign up</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
