"use client";

import Image from "next/image";
import { FeedEditDialog } from "@/components/feed/feed-edit-dialog";
import { Database } from "@/types/database.types";
import { PublicProfile } from "@/types/profile";
import { useLoginDialog } from "@/context/LoginDialogContext";

interface FeedCreateButtonProps {
  user: PublicProfile | null;
  avatarUrl: string | null;
}

export function FeedCreateButton({ user, avatarUrl }: FeedCreateButtonProps) {
  const { openLoginDialog } = useLoginDialog();

  const buttonContent = (
    <div className="flex items-center cursor-pointer">
      <Image
        src={avatarUrl || "/default_avatar.png"}
        alt="User Avatar"
        width={36}
        height={36}
        className="rounded-full object-cover aspect-square mr-3"
      />
      <div className="text-gray-500">무슨 생각을 하고 계신가요?</div>
    </div>
  );

  if (!user) {
    return (
      <div
        className="px-4 py-3 border-b border-gray-200"
        onClick={openLoginDialog}
      >
        {buttonContent}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <FeedEditDialog
        userId={user.id}
        avatarUrl={avatarUrl}
        username={user.username}
        full_name={user.full_name}
      >
        {buttonContent}
      </FeedEditDialog>
    </div>
  );
}
