"use client";

import { useLoginDialog } from "@/context/LoginDialogContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/google_logo_2_littledeep.png"
                  alt="Google logo"
                  width={18}
                  height={18}
                />
                <span>Google 계정으로 로그인</span>
              </div>
            </Button>
          </form>
          <form action={loginWithKakao}>
            <Button type="submit" className="w-full bg-[#FDDD32] text-black hover:bg-[#FDDD32]/90">
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/kakao_logo.png"
                  alt="Kakao logo"
                  width={32}
                  height={32}
                />
                <span>카카오로 로그인</span>
              </div>
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
