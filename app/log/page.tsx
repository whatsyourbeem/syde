import { createClient } from "@/lib/supabase/server";
import { LogListServer } from "@/components/log/log-list-server";

export const revalidate = 0;

export default async function LogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LogListServer currentUserId={user?.id || null} />;
}