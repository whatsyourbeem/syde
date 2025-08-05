"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { login } from "@/app/auth/login/actions";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "로그인 중..." : "로그인"}
    </Button>
  );
}

export function LoginForm({
  className,
  onSignUpClick,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { onSignUpClick?: () => void }) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input id="password" type="password" name="password" required />
              </div>
              <SubmitButton />
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              {onSignUpClick ? (
                <button
                  type="button"
                  onClick={onSignUpClick}
                  className="underline underline-offset-4"
                >
                  Sign up
                </button>
              ) : (
                <Link
                  href="/auth/sign-up"
                  className="underline underline-offset-4"
                >
                  Sign up
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
