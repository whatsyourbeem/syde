"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const CONTACT_EMAIL = "whatsyourbeem@gmail.com";

// handle_new_user raises USER_BANNED for blacklisted users, but in the OAuth flow Supabase only
// reports a generic "Database error saving new user" (verified locally), so a banned user cannot
// be told apart from any other sign-up failure.
function getSignupFailureKind(error: { message: string; description: string }) {
  const text = `${error.message} ${error.description}`;
  if (text.includes("USER_BANNED")) return "banned";
  if (text.includes("Database error saving new user")) return "signup-failed";
  return null;
}

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState({
    message: "",
    code: "",
    description: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.substring(1)); // Remove '#' from hash

    setError({
      message: params.get("message") || hash.get("error") || "",
      code: params.get("code") || hash.get("error_code") || "",
      description: params.get("description") || hash.get("error_description") || "",
    });

  }, [searchParams]);

  const failureKind = getSignupFailureKind(error);
  if (failureKind) {
    const isBanned = failureKind === "banned";
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {isBanned ? "이용이 제한된 계정입니다" : "가입을 완료할 수 없습니다"}
              </CardTitle>
              <CardDescription>
                {isBanned
                  ? "해당 계정으로는 SYDE에 가입하거나 로그인할 수 없습니다."
                  : "이용이 제한된 계정이거나 일시적인 오류로 가입에 실패했습니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {isBanned ? "문의사항은" : "잠시 후 다시 시도해도 같은 문제가 계속되면"}{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-sydeblue underline">
                {CONTACT_EMAIL}
              </a>
              {isBanned ? "으로 보내주세요." : "으로 문의해 주세요."}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
            <CardDescription>
              Sorry, something went wrong during the authentication process.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {error.message && (
              <div>
                <p className="font-semibold text-destructive">Error Message:</p>
                <p className="text-muted-foreground break-all">{decodeURIComponent(error.message)}</p>
              </div>
            )}
            {error.description && (
              <div>
                <p className="font-semibold text-destructive">Details:</p>
                <p className="text-muted-foreground break-all">{decodeURIComponent(error.description)}</p>
              </div>
            )}
            {error.code && (
              <div>
                <p className="font-semibold text-destructive">Error Code:</p>
                <p className="text-muted-foreground break-all">{error.code}</p>
              </div>
            )}
             {!error.message && !error.description && (
                <p className="text-muted-foreground">An unspecified error occurred.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}