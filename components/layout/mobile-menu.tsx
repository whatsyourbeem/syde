"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ClientAuthButton } from "@/components/auth/client-auth-button"; // Import ClientAuthButton
import { User } from "@supabase/supabase-js"; // Import User type

interface MobileMenuProps {
  user: User | null; // Add user prop
  avatarUrl: string | null;
  username: string | null;
}

export function MobileMenu({ user, avatarUrl, username }: MobileMenuProps) { // Destructure user
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px] sm:w-[300px]">
        <div className="flex flex-col gap-4 p-4">
          {/* KakaoTalk Link */}
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
            <span className="text-[#4B4737]">SYDE 오픈채팅</span>
          </Link>

          {/* ClientAuthButton */}
          <ClientAuthButton
            user={user} // Pass user prop
            avatarUrl={avatarUrl}
            username={username}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}