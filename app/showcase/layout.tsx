import { createClient } from "@/lib/supabase/server";
import { ShowcaseHeader } from "@/components/showcase/showcase-header";
import { ShowcaseLayoutContent } from "@/components/showcase/showcase-layout-content";
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
    <>
      <ShowcaseHeader />
      <ShowcaseLayoutContent
        user={user}
        profile={profile}
        avatarUrl={avatarUrl}
      >
        {children}
      </ShowcaseLayoutContent>
    </>
  );
}
