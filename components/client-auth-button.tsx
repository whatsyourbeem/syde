"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import Image from "next/image";
import { useLoginModal } from "@/context/LoginModalContext"; // Import useLoginModal

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
          <Link href={profileLink} className="flex-none">
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
        <div className="flex gap-2">
          <Button size="sm" variant={"outline"} onClick={openLoginModal}>
            Sign in
          </Button>
          <Button asChild size="sm" variant={"default"}>
            <Link href="/auth/sign-up">Sign up</Link>
          </Button>
        </div>
      )}
    </>
  );
}
