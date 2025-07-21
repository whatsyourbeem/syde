"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Successfully logged out.");
    router.push("/");
    router.refresh();
  };

  return <Button onClick={logout}>Logout</Button>;
}
