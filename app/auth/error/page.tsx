"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const CONTACT_EMAIL = "whatsyourbeem@gmail.com";

// handle_new_user raises USER_BANNED for blacklisted users. Depending on the auth flow, Supabase
// surfaces it either verbatim or as a generic "Database error saving new user".
function isBannedError(error: { message: string; description: string }) {
  const text = `${error.message} ${error.description}`;
  return text.includes("USER_BANNED") || text.includes("Database error saving new user");
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

  if (isBannedError(error)) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">이용이 제한된 계정입니다</CardTitle>
              <CardDescription>
                해당 계정으로는 SYDE에 가입하거나 로그인할 수 없습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              문의사항은{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-sydeblue underline">
                {CONTACT_EMAIL}
              </a>
              으로 보내주세요.
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