import { createClient } from "@/lib/supabase/server";
import { ShowcaseListWrapper } from "@/components/showcase/showcase-list-wrapper";
import { ShowcaseHeader } from "@/components/showcase/showcase-header";
import { redirect } from "next/navigation";

export default async function ShowcasePage() {
  redirect("/log"); // TODO: 쇼케이스 정식 오픈 시 삭제

  /* TODO: 쇼케이스 정식 오픈 시 주석 해제
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  const avatarUrl =
    profile?.avatar_url && profile.updated_at
      ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}`
      : null;

  return (
    <>
      <ShowcaseHeader />
      <ShowcaseListWrapper user={profile} avatarUrl={avatarUrl} />
    </>
  );
  */
}
