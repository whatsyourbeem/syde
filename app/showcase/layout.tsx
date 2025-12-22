import { createClient } from "@/lib/supabase/server";
import { ShowcaseEditDialog } from "@/components/showcase/showcase-edit-dialog";
import { ShowcaseRightSidebar } from "@/components/showcase/right-sidebar";
import { LoginPromptCard } from "@/components/auth/login-prompt-card";
import Image from "next/image";
import Link from "next/link";

export default async function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let avatarUrl = null;
  if (user) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*, updated_at")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile for ShowcaseForm:", profileError);
    } else if (data) {
      profile = data;
      avatarUrl =
        profile.avatar_url && profile.updated_at
          ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}`
          : profile.avatar_url;
    }
  }

  return (
    <main className="flex justify-center gap-x-5 pb-3 md:px-5 md:pb-5 max-w-6xl mx-auto">
      <div className="hidden md:block w-1/5 sticky top-[70px] self-start h-screen">
        {user && profile ? (
          <ShowcaseEditDialog
            userId={user.id}
            avatarUrl={avatarUrl}
            username={profile.username}
            full_name={profile.full_name}
            tagline={profile.tagline}
            certified={profile.certified}
          />
        ) : (
          <LoginPromptCard />
        )}
      </div>
      <div className="w-full md:w-4/5 lg:w-3/5 border-x border-gray-200">
        {children}
      </div>
      <ShowcaseRightSidebar />
    </main>
  );
}
