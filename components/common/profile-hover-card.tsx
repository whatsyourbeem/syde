"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/types/database.types";
import { CertifiedBadge } from "@/components/ui/certified-badge";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileHoverCardProps {
  userId: string;
  children: React.ReactNode;
  profileData?: Profile | null;
  disableHover?: boolean; // New prop
}

export default function ProfileHoverCard({
  userId,
  children,
  profileData,
  disableHover = false, // Default to false
}: ProfileHoverCardProps) {
  const [profile, setProfile] = useState<Profile | null>(profileData || null);
  const [isLoading, setIsLoading] = useState(!profileData);
  const supabase = createClient();

  useEffect(() => {
    // Only fetch if profileData was not provided
    if (!profileData && userId) {
      const fetchProfile = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching profile for hover card:", error);
          setProfile(null);
        } else {
          setProfile(data);
        }
        setIsLoading(false);
      };
      fetchProfile();
    }
  }, [userId, profileData, supabase]);

  if ((!profile && !isLoading) || disableHover) {
    return <>{children}</>; // Render children without hover card if profile not found or hover is disabled
  }

  return (
    <HoverCard openDelay={350}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80" align="start" alignOffset={-48}>
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <p>로딩 중...</p>
          </div>
        ) : (
          <Link href={`/${profile?.username || profile?.id}`}>
            <div className="flex justify-start space-x-3">
              <Avatar className="size-16">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {profile?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <h4 className="text-base font-semibold">
                    {profile?.full_name || ""}
                  </h4>
                  {profile?.certified && <CertifiedBadge size="md" />}
                </div>
                <p className="text-sm">@{profile?.username || "Anonymous"}</p>
                {profile?.tagline && (
                  <p className="text-xs text-muted-foreground">
                    {profile.tagline}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
