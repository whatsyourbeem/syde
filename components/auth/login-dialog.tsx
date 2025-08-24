"use client";

import { useLoginDialog } from "@/context/LoginDialogContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { loginWithGoogle, loginWithKakao } from "@/app/auth/login/actions";


export function LoginDialog() {
  const { isLoginDialogOpen, closeLoginDialog } = useLoginDialog();

  return (
    <Dialog open={isLoginDialogOpen} onOpenChange={closeLoginDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
          <DialogDescription>
            SYDE에 오신 것을 환영합니다! 소셜 계정으로 간편하게 로그인하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <form action={loginWithGoogle}>
            <Button type="submit" className="w-full">
              Google 계정으로 로그인
            </Button>
          </form>
          <form action={loginWithKakao}>
            <Button type="submit" className="w-full bg-[#FEE500] text-black hover:bg-[#FEE500]/90">
              카카오 계정으로 로그인
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
