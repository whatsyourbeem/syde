"use client";

import { Tables } from "@/types/database.types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Profile = Tables<"profiles">;

interface MemberCardProps {
  profile: Profile;
  tagline?: string | null;
  isOwner?: boolean;
  isCurrentUser?: boolean;
  status?: string | null;
  showStatusBadge?: boolean;
  showButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
  isLoading?: boolean;
}

export default function MemberCard({
  profile,
  tagline,
  isOwner = false,
  isCurrentUser = false,
  status,
  showStatusBadge = true,
  showButton = false,
  buttonText,
  onButtonClick,
  isLoading = false,
}: MemberCardProps) {
  if (!profile) return null;

  return (
    <ProfileHoverCard userId={profile.id} profileData={profile}>
      <div
        className={`border rounded-md p-2 transition-colors ${
          isCurrentUser ? "bg-gray-50" : "bg-white"
        }`}
      >
        <Link href={`/${profile.username}`} className="block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2 overflow-hidden">
              <div className="relative flex-shrink-0">
                <Avatar className="size-7">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {isOwner && (
                  <Crown className="absolute -top-1 -left-1 size-4 text-yellow-500 fill-yellow-500 bg-white rounded-full p-0.5" />
                )}
              </div>
              <div className="text-left overflow-hidden min-w-0">
                <p className="font-semibold text-sm truncate">
                  {profile.full_name || profile.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{profile.username || profile.id}
                </p>
              </div>
            </div>
            {status && showStatusBadge && (
              <span className="text-xs font-medium text-gray-500 flex-shrink-0 ml-2">
                {status}
              </span>
            )}
          </div>
          {tagline && (
            <p className="text-xs text-muted-foreground line-clamp-1 h-[1rem] mt-1">
              {tagline}
            </p>
          )}
        </Link>
        {showButton && buttonText && onButtonClick && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onButtonClick();
              }}
              disabled={isLoading}
              className="text-xs h-7 px-2 w-full"
            >
              {buttonText}
            </Button>
          </div>
        )}
      </div>
    </ProfileHoverCard>
  );
}