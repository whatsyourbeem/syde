"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Database } from "@/types/database.types";

type Club = Database["public"]["Tables"]["clubs"]["Row"] & {
  owner_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  member_count: number;
  members: Database["public"]["Tables"]["profiles"]["Row"][]; // Add members array
};

interface ClubCardProps {
  club: Club;
}

export default function ClubCard({ club }: ClubCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/socialing/club/${club.id}`);
  };

  return (
    <div
      className="bg-white rounded-lg overflow-hidden w-full flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex-shrink-0">
        <Image
          src={
            club.thumbnail_url ||
            "https://wdtkwfgmsbtjkraxzazx.supabase.co/storage/v1/object/public/meetup-images//default_thumbnail.png"
          }
          alt={club.name}
          width={128}
          height={128}
          className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-md"
        />
      </div>
      <div className="flex-grow flex flex-col justify-between self-stretch">
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-1 line-clamp-2">
            {club.name}
          </h2>
          {club.tagline && (
            <p className="text-xs md:text-sm text-gray-600 mt-1 mb-2 line-clamp-1">
              {club.tagline}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 py-2">
          <div onClick={(e) => e.stopPropagation()}>
            <HoverCard openDelay={350}>
              <div className="flex items-center gap-2">
                <HoverCardTrigger asChild>
                  <Link href={`/${club.owner_profile?.username}`}>
                    <Avatar className="size-5 md:size-6">
                      <AvatarImage
                        src={club.owner_profile?.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {club.owner_profile?.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </HoverCardTrigger>
                <p>
                  <HoverCardTrigger asChild>
                    <Link href={`/${club.owner_profile?.username}`}>
                      <span className="font-semibold text-black hover:underline">
                        {club.owner_profile?.full_name ||
                          club.owner_profile?.username ||
                          "알 수 없음"}
                      </span>
                    </Link>
                  </HoverCardTrigger>
                  <span className="ml-1">클럽장</span>
                </p>
              </div>
              <HoverCardContent
                className="w-80"
                align="start"
                alignOffset={-28}
              >
                {club.owner_profile && (
                  <Link href={`/${club.owner_profile.username}`}>
                    <div className="flex justify-start space-x-4">
                      {club.owner_profile.avatar_url ? (
                        <Image
                          src={club.owner_profile.avatar_url}
                          alt={`${
                            club.owner_profile.username || "User"
                          }'s avatar`}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-2xl font-semibold">
                            {club.owner_profile.username?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <h4 className="text-base font-semibold">
                          {club.owner_profile.full_name || ""}
                        </h4>
                        <p className="text-sm">
                          @{club.owner_profile.username || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {club.owner_profile.tagline || ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                )}
              </HoverCardContent>
            </HoverCard>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2 overflow-hidden">
              {club.members.map((member, index) => (
                <Avatar
                  key={member.id || index}
                  className="size-5 md:size-7 border-2 border-white"
                >
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback>
                    {member.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span>{club.member_count}명</span>
          </div>
        </div>
      </div>
    </div>
  );
}
