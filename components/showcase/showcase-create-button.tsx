"use client";

import Image from "next/image";
import { ShowcaseEditDialog } from "@/components/showcase/showcase-edit-dialog";
import { Database } from "@/types/database.types";
import { useLoginDialog } from "@/context/LoginDialogContext";

interface ShowcaseCreateButtonProps {
  user: Database["public"]["Tables"]["profiles"]["Row"] | null;
  avatarUrl: string | null;
  className?: string;
  children?: React.ReactNode;
}

export function ShowcaseCreateButton({
  user,
  avatarUrl,
  className,
  children,
}: ShowcaseCreateButtonProps) {
  const { openLoginDialog } = useLoginDialog();
  const wrapperClass = className || "px-4 py-3 border-b border-gray-200";

  const content = (
    <div className={wrapperClass}>
      {children || (
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
      )}
    </div>
  );

  if (!user) {
    return <div onClick={openLoginDialog}>{content}</div>;
  }

  return (
    <ShowcaseEditDialog
      userId={user.id}
      avatarUrl={avatarUrl}
      username={user.username}
      full_name={user.full_name}
    >
      {content}
    </ShowcaseEditDialog>
  );
}
