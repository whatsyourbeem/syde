import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserActivityLogList } from "@/components/user/user-activity-log-list";

export default async function ProfileActivityPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="w-full max-w-[850px] mx-auto flex flex-col">
        <div className="w-full px-5 py-5 md:px-8">
          <UserActivityLogList currentUserId={user.id} userId={user.id} />
        </div>
      </div>
    </div>
  );
}
