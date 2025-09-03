"use client";

import { logout } from "@/app/auth/auth-actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" size="sm" variant="outline">
        로그아웃
      </Button>
    </form>
  );
}
