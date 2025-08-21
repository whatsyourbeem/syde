import { createClient } from "@/lib/supabase/server";
import ClubList from "@/components/club/club-list";

export default async function ClubPage() {
  const supabase = await createClient();

  // Fetch clubs
  const { data: clubs, error: clubsError } = await supabase
    .from("clubs")
    .select("*, owner_profile:profiles!clubs_owner_id_fkey(avatar_url, bio, full_name, id, link, tagline, updated_at, username), member_count:club_members(count)")
    .order("created_at", { ascending: false });

  if (clubsError) {
    console.error("Error fetching clubs:", clubsError);
    return (
      <div className="container mx-auto p-4">
        클럽 데이터를 불러오는 데 실패했습니다.
      </div>
    );
  }
  
  const clubsWithMemberCount = clubs?.map(club => ({
    ...club,
    member_count: Array.isArray(club.member_count) ? club.member_count[0]?.count || 0 : 0,
  })) || [];

  return (
    <div className="w-full p-4">
      <ClubList clubs={clubsWithMemberCount} />
    </div>
  );
}
