"use client";

import Link from "next/link";
import Image from "next/image";
import { CirclePlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CertifiedBadge } from "@/components/ui/certified-badge";
import { cn } from "@/lib/utils";

interface ShowcaseSidebarButtonProps {
  userId: string;
  avatarUrl: string | null;
  username: string | null;
  full_name: string | null;
  tagline?: string | null;
  certified?: boolean | null;
}

export function ShowcaseSidebarButton({
  userId,
  avatarUrl,
  username,
  full_name,
  tagline,
  certified,
}: ShowcaseSidebarButtonProps) {
  return (
    <div className="flex flex-col items-center py-5 px-[10px] text-sydenightblue gap-[10px] rounded-lg bg-transparent">
      {avatarUrl && (
        <Image
          src={avatarUrl}
          alt="User Avatar"
          width={36}
          height={36}
          className="rounded-full object-cover aspect-square"
        />
      )}
      {full_name && (
        <div className="flex items-center gap-1">
          <p className="text-sm leading-[14px] font-bold ">{full_name}</p>
          {certified && <CertifiedBadge size="sm" />}
        </div>
      )}
      {username && <p className="text-xs leading-3 font-normal">@{username}</p>}
      {tagline && (
        <p className="text-xs leading-3 font-normal text-[#777777]">
          {tagline}
        </p>
      )}
      <Link href="/showcase/create" className="w-full">
        <div
          className={cn(
            buttonVariants({ variant: "default" }),
            "mt-4 h-auto flex flex-col gap-[10px] py-3 px-4 rounded-[12px] w-full cursor-pointer",
          )}
        >
          <CirclePlus className="size-5" strokeWidth={2.5} />
          <span className="text-sm leading-[14px] font-semibold">
            내 SYDE 프로젝트 등록하기
          </span>
        </div>
      </Link>
    </div>
  );
}
