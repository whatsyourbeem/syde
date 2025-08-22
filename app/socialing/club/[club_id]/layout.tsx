
import { createClient } from "@/lib/supabase/server";
import ClubMembersList from "@/components/club/club-members-list";
import ClubSidebarInfo from "@/components/club/club-sidebar-info";
import { notFound } from "next/navigation";
import ClubActionsDropdown from "@/components/club/club-actions-dropdown";

export default async function ClubDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { club_id: string };
}) {
  const { club_id } = params;
  const supabase = await createClient();

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("*, owner_profile:profiles!clubs_owner_id_fkey(*)")
    .eq("id", club_id)
    .single();

  const { data: members, error: membersError } = await supabase
    .from("club_members")
    .select("*, profiles(*)")
    .eq("club_id", club_id);

  if (clubError || membersError || !club) {
    console.error(clubError || membersError);
    notFound();
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;
  const isOwner = currentUserId === club.owner_id;

  let isMember = false;
  let userRole: string | null = null;

  if (currentUserId) {
    const { data: memberData } = await supabase
      .from("club_members")
      .select("role")
      .eq("club_id", club_id)
      .eq("user_id", currentUserId)
      .single();

    if (memberData) {
      isMember = true;
      userRole = memberData.role;
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] justify-center gap-x-5 pb-3 md:pb-5">
      <div className="hidden md:block w-1/4 sticky top-[70px] self-start h-screen">
        <ClubSidebarInfo
          clubName={club.name}
          clubTagline={club.tagline || undefined}
          clubId={club.id}
          ownerProfileAvatarUrl={club.owner_profile?.avatar_url || undefined}
          ownerProfileUsername={club.owner_profile?.username || undefined}
          ownerProfileFullName={club.owner_profile?.full_name || undefined}
          isMember={isMember}
          currentUserId={currentUserId}
          userRole={userRole}
        />
      </div>
      <div className="w-full md:w-2/3 lg:w-3/5 border-x border-gray-200">
        <ClubActionsDropdown
          clubId={club.id}
          isOwner={isOwner}
          isMember={isMember}
          currentUserId={currentUserId || undefined}
        />
        {children}
      </div>
      <div className="hidden lg:block w-1/6 sticky top-[70px] self-start h-screen">
        <ClubMembersList members={members || []} />
      </div>
    </main>
  );
}
