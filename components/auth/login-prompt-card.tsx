"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

import { useLoginDialog } from "@/context/LoginDialogContext";

export function LoginPromptCard() {
  const { openLoginDialog } = useLoginDialog();
  return (
    <div className="flex flex-col items-center p-4 rounded-lg bg-card text-center">
      <Image
        src="/we-are-syders.png"
        alt="We are SYDERS"
        width={56}
        height={56}
        className="mb-4 rounded-full"
      />
      <p className="text-sm font-semibold mb-4">
        주체적인 삶으로 가득한 세상,
        <br />
        1194명의 SYDER와 함께해요.
      </p>
      <Button onClick={openLoginDialog}>SYDE 시작하기</Button>
    </div>
  );
}
