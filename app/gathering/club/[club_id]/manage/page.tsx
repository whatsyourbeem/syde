import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ClubForumManagementPage from "@/components/club/club-forum-management-page";

interface ManageClubForumsPageProps {
  params: Promise<{ club_id: string }>;
}

export default async function ManageClubForumsPage({ params }: ManageClubForumsPageProps) {
  const { club_id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: club, error } = await supabase
    .from("clubs")
    .select(`
      *,
      forums:club_forums(*)
    `)
    .eq("id", club_id)
    .order("position", { foreignTable: "club_forums", ascending: true })
    .single();

  if (error || !club) {
    notFound();
  }

  if (club.owner_id !== user.id) {
    // Or show an unauthorized page
    redirect(`/gathering/club/${club.id}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ClubForumManagementPage club={club} initialForums={club.forums} />
    </div>
  );
}
