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
    <div className="flex flex-col items-center p-4">
      {avatarUrl && (
        <Image
          src={avatarUrl}
          alt="User Avatar"
          width={60}
          height={60}
          className="rounded-full object-cover aspect-square mb-4"
        />
      )}
      {full_name && (
        <div className="flex items-center gap-1">
          <p className="text-base font-bold">{full_name}</p>
          {certified && <CertifiedBadge size="md" />}
        </div>
      )}
      {username && <p className="text-sm text-gray-500">@{username}</p>}
      <Link href="/showcase/create" className="w-full">
        <Button
          variant="default"
          className="mt-4 w-full h-auto flex flex-col gap-[10px] py-3 px-4 rounded-[12px]"
        >
          <CirclePlus className="size-5" strokeWidth={2.5} />
          <span className="text-sm leading-[14px] font-semibold">
            내 프로젝트 등록하기
          </span>
        </Button>
      </Link>
    </div>
  );
}
