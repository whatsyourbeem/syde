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
import { useLoginModal } from "@/context/LoginModalContext";
import { signup } from "@/app/auth/sign-up/actions";
import { useFormStatus } from "react-dom";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "계정 생성 중..." : "회원가입"}
    </Button>
  );
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { openLoginModal } = useLoginModal();
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error && e.target.value === repeatPassword) {
      setError(null);
    }
  };

  const handleRepeatPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepeatPassword(e.target.value);
    if (error && e.target.value === password) {
      setError(null);
    }
  };

  const handleSubmit = (formData: FormData) => {
    if (password !== repeatPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setError(null);
    signup(formData);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="홍길동"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="gildong"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Repeat Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={handleRepeatPasswordChange}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <SubmitButton />
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                onClick={openLoginModal}
                className="p-0 h-auto leading-none align-baseline underline underline-offset-4"
              >
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
