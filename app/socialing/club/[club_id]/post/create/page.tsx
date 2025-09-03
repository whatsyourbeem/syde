import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ClubPostForm from "@/components/club/club-post-form";

export default async function ClubPostCreatePage({ params, searchParams }: { params: Promise<{ club_id: string }>; searchParams: Promise<{ forum_id?: string }>; }) {
  const supabase = await createClient();
  const { club_id } = await params;
  const { forum_id: initialForumId } = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, owner_id, forums:club_forums(*)")
    .eq("id", club_id)
    .single();

  if (clubError || !club) {
    notFound();
  }

  const { data: member } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club_id)
    .eq("user_id", user.id)
    .single();

  const isOwner = user.id === club.owner_id;
  const userRole = member?.role || null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">새 게시글 작성</h1>
      <ClubPostForm
        clubId={club.id}
        forums={club.forums || []}
        userRole={userRole}
        isOwner={isOwner}
        initialForumId={initialForumId}
      />
    </div>
  );
}