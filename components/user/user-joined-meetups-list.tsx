"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import { Search, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Meetup = Database["public"]["Tables"]["meetups"]["Row"];

interface MeetupParticipantWithMeetup {
  meetup_id: string;
  meetups: Meetup | null;
}

interface UserJoinedMeetupsListProps {
  userId: string;
  variant?: "scroll" | "grid";
}

export function UserJoinedMeetupsList({ userId, variant = "scroll" }: UserJoinedMeetupsListProps) {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJoinedMeetups = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("meetup_participants")
          .select(`
            meetup_id,
            meetups (*)
          `)
          .eq("user_id", userId)
          .returns<MeetupParticipantWithMeetup[]>();

        if (error) {
          console.error("Error fetching joined meetups:", error);
          return;
        }

        const validMeetups = (data
          ?.map((item) => item.meetups)
          .filter(Boolean) as Meetup[])
          .sort((a, b) => {
            const dateA = a.start_datetime ? new Date(a.start_datetime).getTime() : 0;
            const dateB = b.start_datetime ? new Date(b.start_datetime).getTime() : 0;
            return dateB - dateA; // 최신순 (내림차순)
          });

        setMeetups(validMeetups || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedMeetups();
  }, [userId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "날짜 미정";
    const date = new Date(dateString);
    const kstDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const year = kstDate.getFullYear().toString().slice(-2);
    const month = (kstDate.getMonth() + 1).toString().padStart(2, "0");
    const day = kstDate.getDate().toString().padStart(2, "0");
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[kstDate.getDay()];
    const hours24 = kstDate.getHours();
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    const period = hours24 < 12 ? "오전" : "오후";
    const minutes = kstDate.getMinutes().toString().padStart(2, "0");
    return `${year}.${month}.${day}(${weekday}) ${period} ${hours12}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="bg-[#FAFAFA] rounded-xl h-[81px] flex items-center justify-center text-center px-4">
        <p className="text-[#777777] text-sm font-light italic">모임 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (meetups.length === 0) {
    return (
      <div className="bg-[#FAFAFA] rounded-xl h-[81px] flex items-center justify-center text-center px-4">
        <p className="text-[#777777] text-sm font-light leading-[150%]">
          아직 참여한 모임이 없어요. 🧐<br />
          어쩌면 다음 모임에서 만날지도 모르겠어요.
        </p>
      </div>
    );
  }

  const isGrid = variant === "grid";
  const displayMeetups = isGrid ? meetups : meetups.slice(0, 5);
  const hasMore = !isGrid && meetups.length > 5;

  return (
    <div className={cn(
      isGrid ? "grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10" : "flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1"
    )}>
      {displayMeetups.map((meetup) => (
        <Link
          key={meetup.id}
          href={`/meetup/${meetup.id}`}
          className={cn("group", isGrid ? "block w-full" : "flex-shrink-0 w-[160px]")}
        >
          <div className={cn(
            "relative w-full overflow-hidden bg-muted/20 mb-3",
            !isGrid && "w-[160px] h-[160px]"
          )}
          style={isGrid ? { aspectRatio: "1/1" } : undefined}
          >
            {isGrid ? (
              <img
                src={meetup.thumbnail_url || "/default_meetup_thumbnail.png"}
                alt={meetup.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <Image
                src={meetup.thumbnail_url || "/default_meetup_thumbnail.png"}
                alt={meetup.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            )}
          </div>
          <p className="text-sm font-bold text-sydeblue line-clamp-1 mb-1 group-hover:underline">
            {meetup.title}
          </p>
          <div className="flex flex-col gap-0.5 text-[11px] text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3 shrink-0" />
              <span className="truncate">{formatDate(meetup.start_datetime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{meetup.location || "장소 미정"}</span>
            </div>
          </div>
        </Link>
      ))}

      {hasMore && (
        <Link
          href="/meetup"
          className="flex-shrink-0 w-[160px] flex flex-col items-center justify-center bg-[#F1F1F1] h-[160px] group hover:bg-gray-200 transition-colors"
        >
          <div className="flex flex-col items-center gap-2">
            <Search className="w-6 h-6 text-[#434343]" />
            <span className="text-xs font-bold text-black text-center px-4">
              {meetups.length - 5}개의 모임 더 보기
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}


