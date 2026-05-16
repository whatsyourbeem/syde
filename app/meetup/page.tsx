import { createClient } from "@/lib/supabase/server";
import MeetupStatusFilter from "@/components/meetup/meetup-status-filter";
import { MeetupCreateFab } from "@/components/meetup/meetup-create-fab";
import { MeetupList } from "@/components/meetup/meetup-list";
import { fetchMeetupsAction } from "@/app/meetup/meetup-data-actions";

export default async function MeetupPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let isCertified = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("certified")
      .eq("id", user.id)
      .single();
    isCertified = profile?.certified === true;
  }

  const awaitedSearchParams = await searchParams;
  const selectedStatus = awaitedSearchParams.status;

  const initialMeetups = await fetchMeetupsAction({
    currentPage: 1,
    status: selectedStatus,
  });

  return (
    <div className="w-full">
      <div className="w-full bg-card border-b">
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <h1 className="text-2xl font-bold mb-2 text-foreground py-2">
              Meetups
            </h1>
            <h2>사이드프로젝트 커뮤니티 네트워킹 모임</h2>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="w-full">
          <div className="flex justify-end px-4 pt-4">
            <MeetupStatusFilter searchParams={awaitedSearchParams} />
          </div>
          <MeetupList initialMeetups={initialMeetups} status={selectedStatus} />
        </div>
      </div>
      {isCertified && <MeetupCreateFab />}
    </div>
  );
}
