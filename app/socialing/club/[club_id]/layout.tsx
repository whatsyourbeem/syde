


import { createClient } from "@/lib/supabase/server";
import ClubMembersList from "@/components/club/club-members-list";
import ClubSidebarInfo from "@/components/club/club-sidebar-info";
import { notFound } from "next/navigation";
import ClubActionsDropdown from "@/components/club/club-actions-dropdown";

function getClubId(params: { club_id: string }): string {
  try {
    return params.club_id;
  } catch (e) {
    console.error("Error accessing club_id from params:", e);
    // Fallback or re-throw, depending on desired behavior
    // For now, return an empty string or throw a specific error
    throw new Error("Failed to get club_id from params");
  }
}

export default async function ClubDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { club_id: string };
}) {
  const supabase = await createClient();

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("*, owner_profile:profiles!clubs_owner_id_fkey(*)")
    .eq("id", getClubId(params))
    .single();

  const { data: members, error: membersError } = await supabase
    .from("club_members")
    .select("*, profiles(*)")
    .eq("club_id", getClubId(params));

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
      .eq("club_id", getClubId(params))
      .eq("user_id", currentUserId)
      .single();

    if (memberData) {
      isMember = true;
      userRole = memberData.role;
    }
  }

  return (
    <main className="flex justify-center items-start gap-x-4 pb-3 md:pb-5 min-h-screen max-w-screen-xl mx-auto">
      <div className="hidden md:block pl-4 w-64 sticky top-[70px] self-start">
        <ClubSidebarInfo
          clubName={club.name}
          clubTagline={club.tagline || undefined}
          clubId={club.id}
          clubThumbnailUrl={club.thumbnail_url || undefined}
          ownerProfile={club.owner_profile}
          isMember={isMember}
          currentUserId={currentUserId}
          userRole={userRole}
        />
      </div>
      <div className="w-auto flex-1 border-x border-gray-200">
        <ClubActionsDropdown
          clubId={club.id}
          isOwner={isOwner}
          isMember={isMember}
          currentUserId={currentUserId || undefined}
        />
        {children}
      </div>
      <div className="hidden lg:block w-[180px] sticky top-[70px] self-start">
        <ClubMembersList members={members || []} />
      </div>
    </main>
  );
}
