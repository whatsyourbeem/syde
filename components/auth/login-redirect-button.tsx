"use client";

import { Button } from "@/components/ui/button";
import { useLoginDialog } from "@/context/LoginDialogContext";

export function LoginRedirectButton() {
  const { openLoginDialog } = useLoginDialog();

  return (
    <Button variant="outline" onClick={openLoginDialog}>
      로그인
    </Button>
  );
}
