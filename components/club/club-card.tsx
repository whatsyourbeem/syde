"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { Database } from "@/types/database.types";
import { CertifiedBadge } from "@/components/ui/certified-badge";

type Club = Database["public"]["Tables"]["clubs"]["Row"] & {
  owner_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  member_count: number;
  members: Database["public"]["Tables"]["profiles"]["Row"][]; // Add members array
};

interface ClubCardProps {
  club: Club;
}

function ClubCardBase({ club }: ClubCardProps) {
  const router = useRouter();
  const [randomMembers, setRandomMembers] = useState<
    Database["public"]["Tables"]["profiles"]["Row"][]
  >([]);

  useEffect(() => {
    const shuffled = [...club.members].sort(() => 0.5 - Math.random());
    setRandomMembers(shuffled.slice(0, 3));
  }, [club.members]);

  const handleCardClick = useCallback(() => {
    router.push(`/socialing/club/${club.id}`);
  }, [club.id, router]);

  return (
    <div
      className="bg-white rounded-lg overflow-hidden w-full flex items-start gap-4 px-4 py-6 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex-shrink-0">
        <Image
          src={club.thumbnail_url || "/default_club_thumbnail.png"}
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
            {club.owner_profile && club.owner_id && (
              <ProfileHoverCard
                userId={club.owner_id}
                profileData={club.owner_profile}
              >
                <div className="flex items-center gap-2">
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
                  <p className="flex items-center gap-1">
                    <Link href={`/${club.owner_profile?.username}`}>
                      <span className="font-semibold text-black hover:underline">
                        {club.owner_profile?.full_name ||
                          club.owner_profile?.username ||
                          "알 수 없음"}
                      </span>
                    </Link>
                    {club.owner_profile?.certified && (
                      <CertifiedBadge size="sm" />
                    )}
                    <span className="ml-1">클럽장</span>
                  </p>
                </div>
              </ProfileHoverCard>
            )}
          </div>
          <div className="flex items-center">
            <div className="flex -space-x-2 overflow-hidden">
              {randomMembers.map((member, index) => (
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
            <span className="pl-1 text-xs md:text-sm text-gray-500">
              {club.member_count > 3
                ? `+${club.member_count}명`
                : `${club.member_count}명`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const ClubCard = memo(ClubCardBase, (prevProps, nextProps) => {
  return (
    prevProps.club.id === nextProps.club.id &&
    prevProps.club.name === nextProps.club.name &&
    prevProps.club.tagline === nextProps.club.tagline &&
    prevProps.club.member_count === nextProps.club.member_count &&
    prevProps.club.thumbnail_url === nextProps.club.thumbnail_url
  );
});

ClubCard.displayName = "ClubCard";

export default ClubCard;
