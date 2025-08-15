import { createClient } from "@/lib/supabase/server";
import { ClientAuthButton } from "./client-auth-button"; // Import ClientAuthButton

export async function AuthButton({ avatarUrl, username, sheetHeader }: { avatarUrl: string | null; username: string | null; sheetHeader?: boolean }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ClientAuthButton user={user} avatarUrl={avatarUrl} username={username} sheetHeader={sheetHeader} />
  );
}
