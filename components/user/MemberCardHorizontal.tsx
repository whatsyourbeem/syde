"use client";

import { Tables } from "@/types/database.types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CertifiedBadge } from "@/components/ui/certified-badge";

type Profile = Tables<"profiles">;

interface MemberCardHorizontalProps {
  profile: Profile;
  isOwner?: boolean;
  isCurrentUser?: boolean;
  showButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
  isLoading?: boolean;
}

export default function MemberCardHorizontal({
  profile,
  isOwner = false,
  isCurrentUser = false,
  showButton = false,
  buttonText,
  onButtonClick,
  isLoading = false,
}: MemberCardHorizontalProps) {
  if (!profile) return null;

  return (
    <ProfileHoverCard userId={profile.id} profileData={profile}>
      <div
        className={`flex flex-col items-center flex-shrink-0 w-32 border rounded-md p-2 ${
          isCurrentUser ? "bg-gray-50" : ""
        }`}
      >
        <Link href={`/${profile.username}`} className="block w-full min-w-0">
          <div className="relative w-12 mx-auto">
            <Avatar className="size-12">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>
                {profile.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <Crown className="absolute -top-1 -left-1 size-6 text-yellow-500 fill-yellow-500 bg-white rounded-full p-0.5" />
            )}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1 w-full">
            <p className="font-semibold text-xs text-center truncate">
              {profile.full_name || profile.username}
            </p>
            {profile.certified && <CertifiedBadge size="sm" />}
          </div>
          <p className="text-xs text-muted-foreground text-center w-full truncate">
            @{profile.username || profile.id}
          </p>
          <p className="text-xs text-muted-foreground text-center w-full truncate h-[1rem]">
            {profile.tagline || " "}
          </p>
        </Link>
        {showButton && buttonText && onButtonClick && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              onButtonClick();
            }}
            disabled={isLoading}
            className="text-xs h-7 px-2 mt-2 w-full"
          >
            {buttonText}
          </Button>
        )}
      </div>
    </ProfileHoverCard>
  );
}
