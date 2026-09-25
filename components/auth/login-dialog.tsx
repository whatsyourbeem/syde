"use client";

import { useLoginDialog } from "@/context/LoginDialogContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { loginWithGoogle, loginWithKakao } from "@/app/auth/login/actions";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";


export function LoginDialog() {
  const { isLoginDialogOpen, closeLoginDialog } = useLoginDialog();
  const router = useRouter();
  // 보안: Next.js 빌드 도구가 배포용 빌드 시 이 코드 블록을 아예 제거하도록 환경변수 체크로 변경
  const isDevelopment = process.env.NODE_ENV === "development";

  // Mirrors app/auth/login/actions.ts's loginWithTestAccount, but called client-side
  // (fixed credentials, dev-only) so it fires onAuthStateChange directly — the server
  // action redirects to "/", which doesn't change the pathname when opened from the
  // feed and so wouldn't reach AuthContext's pathname-based resync either.
  const handleTestLogin = async () => {
    const supabase = createClient();
    const testEmail = "test@example.com";
    const testPassword = "password123";

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: { data: { username: "testuser", full_name: "Test User" } },
      });
      if (signUpError) {
        console.error("Test login failed:", signUpError.message);
        return;
      }
    }

    closeLoginDialog();
    // The header updates via onAuthStateChange, but Server Components that read
    // the session with their own cookie-based auth.getUser() (e.g. showcase's
    // upvote state, club membership/role) won't see this until the router cache
    // is invalidated.
    router.refresh();
  };

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

          {isDevelopment && (
            <div className="mt-2 pt-4 border-t border-dashed border-gray-200">
              <p className="text-[10px] text-gray-400 mb-2 text-center">로컬 개발용 (테스트 계정)</p>
              <Button
                type="button"
                variant="outline"
                className="w-full border-sydeblue text-sydeblue hover:bg-gray-50"
                onClick={handleTestLogin}
              >
                테스트 계정으로 즉시 로그인
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
