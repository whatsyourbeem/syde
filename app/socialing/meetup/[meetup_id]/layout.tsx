import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Tables, Enums } from "@/types/database.types";
import MeetupSidebarInfo from "@/components/meetup/meetup-sidebar-info"; // New component

export default async function MeetupDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { meetup_id: string };
}) {
  return (
    <div className="flex flex-col md:flex-row max-w-6xl mx-auto px-4 md:space-x-2">
      <div className="w-full md:w-3/4">{children}</div>
      <div className="w-full md:w-1/4 mt-4 md:mt-0">
        <MeetupSidebarInfo
          meetupId={params.meetup_id}
        />
      </div>
    </div>
  );
}