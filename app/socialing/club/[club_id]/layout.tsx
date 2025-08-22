
import { createClient } from "@/lib/supabase/server";
import ClubMembersList from "@/components/club/club-members-list";
import ClubSidebarInfo from "@/components/club/club-sidebar-info";
import { notFound } from "next/navigation";

import Link from "next/link";

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

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  let isMember = false;
  let userRole: string | null = null;

  if (currentUserId) {
    const { data: memberData, error: memberError } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club_id)
      .eq('user_id', currentUserId)
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
          club={club}
          isMember={isMember}
          currentUserId={currentUserId}
          userRole={userRole}
        />
      </div>
      <div className="w-full md:w-2/3 lg:w-3/5 border-x border-gray-200">
        {children}
      </div>
      <div className="hidden lg:block w-1/6 sticky top-[70px] self-start h-screen">
        <ClubMembersList members={members || []} />
      </div>
    </main>
  );
}
