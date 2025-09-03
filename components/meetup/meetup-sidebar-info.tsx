"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Database } from "@/types/database.types";
import { MEETUP_PARTICIPANT_STATUSES } from "@/lib/constants";

type Meetup = Database["public"]["Tables"]["meetups"]["Row"] & {
  clubs: Database["public"]["Tables"]["clubs"]["Row"] | null;
  organizer_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  meetup_participants: (Database["public"]["Tables"]["meetup_participants"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  })[];
};
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface MeetupSidebarInfoProps {
  meetupId: string;
}

export default function MeetupSidebarInfo({
  meetupId,
}: MeetupSidebarInfoProps) {
  const [meetupData, setMeetupData] = useState<Meetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetup = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("meetups")
        .select(
          "*, clubs(*), organizer_profile:profiles!meetups_organizer_id_fkey(full_name, username, avatar_url), meetup_participants(*, profiles(id, full_name, username, avatar_url, tagline)), category, location_type, status, start_datetime, end_datetime, location_description, max_participants"
        )
        .eq("id", meetupId)
        .single();

      if (error) {
        console.error("Error fetching meetup details:", error);
        setError("모임 정보를 불러오는데 실패했습니다.");
        setMeetupData(null);
      } else if (!data) {
        setError("모임을 찾을 수 없습니다.");
        setMeetupData(null);
      } else {
        // Ensure description is parsed as JSON if it's a string
        if (typeof data.description === 'string') {
          try {
            data.description = JSON.parse(data.description);
          } catch (e) {
            console.error("Failed to parse meetup description JSON:", e);
            data.description = null;
          }
        }
        setMeetupData(data as Meetup);
      }
      setLoading(false);
    };

    if (meetupId) {
      fetchMeetup();
    }
  }, [meetupId]);

  if (loading) {
    return <div className="md:block md:border-l pl-4 pt-4">로딩 중...</div>;
  }

  if (error) {
    return <div className="md:block md:border-l pl-4 pt-4 text-red-500">오류: {error}</div>;
  }

  if (!meetupData) {
    return <div className="md:block md:border-l pl-4 pt-4">모임 정보를 찾을 수 없습니다.</div>;
  }

  const meetup = meetupData; // Use meetupData as the primary meetup object


  return (
    <div className="md:block pl-6 pt-4 flex-grow pb-16">
      {meetup.clubs && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">주최 클럽</h2>
          <Link
            href={`/socialing/club/${meetup.clubs.id}`}
            className="inline-flex items-center gap-2 text-md font-semibold text-primary hover:underline"
          >
            <Image
              src={meetup.clubs.thumbnail_url || "/default_club_thumbnail.png"}
              alt={meetup.clubs.name || "Club Thumbnail"}
              width={36}
              height={36}
              className="rounded-md aspect-square object-cover"
            />
            {meetup.clubs.name}
          </Link>
        </div>
      )}

      <div className="bg-white rounded-lg p-0 mb-6">
        <h2 className="text-xl font-semibold mb-2">
          참가자 ({meetup.meetup_participants.filter(p => p.status === MEETUP_PARTICIPANT_STATUSES.APPROVED).length}명)
        </h2>
        {meetup.max_participants && (
          <p className="text-sm text-gray-600 mb-3">
            최대 인원: {meetup.max_participants}명
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {meetup.meetup_participants.filter(p => p.status === MEETUP_PARTICIPANT_STATUSES.APPROVED).length > 0 ? (
            meetup.meetup_participants.filter(p => p.status === MEETUP_PARTICIPANT_STATUSES.APPROVED).map((participant) => (
              <div key={participant.profiles?.id} className="flex flex-col items-start gap-2 p-3 border rounded-lg w-48 flex-shrink-0 cursor-pointer">
                <div className="flex items-center gap-2 w-full">
                  <Avatar className="size-10">
                    <AvatarImage src={participant.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {participant.profiles?.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {participant.profiles?.full_name || "알 수 없음"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{participant.profiles?.username || "알 수 없음"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 w-full truncate h-[1rem]">
                    {participant.profiles?.tagline}
                  </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">아직 확정된 참가자가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg p-0 mb-6">
        <h2 className="text-xl font-semibold mb-3">
          참가 대기중 ({meetup.meetup_participants.filter(p => p.status === MEETUP_PARTICIPANT_STATUSES.PENDING).length}명)
        </h2>
        <div className="flex flex-wrap gap-3">
          {meetup.meetup_participants.filter(p => p.status === MEETUP_PARTICIPANT_STATUSES.PENDING).length > 0 ? (
            meetup.meetup_participants.filter(p => p.status === MEETUP_PARTICIPANT_STATUSES.PENDING).map((participant) => (
              <div key={participant.profiles?.id} className="flex flex-col items-start gap-2 p-3 border rounded-lg w-48 flex-shrink-0 cursor-pointer">
                <div className="flex items-center gap-2 w-full">
                  <Avatar className="size-10">
                    <AvatarImage src={participant.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {participant.profiles?.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {participant.profiles?.full_name || "알 수 없음"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{participant.profiles?.username || "알 수 없음"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 w-full truncate h-[1rem]">
                    {participant.profiles?.tagline}
                  </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">
              현재 참가 대기중인 멤버가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}