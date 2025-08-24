"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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