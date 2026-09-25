"use client";

import { logout } from "@/app/auth/auth-actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const handleLogout = async () => {
    // Fire SIGNED_OUT locally first so AuthContext updates immediately — logout()
    // below redirects server-side, which is a client-side navigation with no
    // reload, so onAuthStateChange would otherwise never see the session change.
    const supabase = createClient();
    await supabase.auth.signOut();
    await logout();
  };

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleLogout}>
      로그아웃
    </Button>
  );
}
