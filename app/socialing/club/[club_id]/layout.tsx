
import { createClient } from "@/lib/supabase/server";
import ClubMembersList from "@/components/club/club-members-list";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  return (
    <main className="flex min-h-[calc(100vh-4rem)] justify-center gap-x-5 pb-3 md:pb-5">
      <div className="hidden md:block w-1/5 sticky top-[70px] self-start h-screen">
        <div className="p-4 rounded-lg shadow bg-white">
          <h2 className="text-xl font-bold mb-2">{club.name}</h2>
          {club.tagline && (
            <p className="text-sm text-muted-foreground mb-4">{club.tagline}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="size-6">
              <AvatarImage src={club.owner_profile?.avatar_url || undefined} />
              <AvatarFallback>{club.owner_profile?.username?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <Link href={`/${club.owner_profile?.username}`} className="hover:underline">
              <span className="font-semibold text-primary">{club.owner_profile?.full_name || club.owner_profile?.username}</span>
              <span className="ml-1">클럽장</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="w-full md:w-4/5 lg:w-3/5 border-x border-gray-200">
        {children}
      </div>
      <div className="hidden lg:block w-1/5 sticky top-[70px] self-start h-screen">
        <ClubMembersList members={members || []} />
      </div>
    </main>
  );
}
